package com.example.vehicledamage.service;

import com.example.vehicledamage.dto.AnalysisResponse;
import com.example.vehicledamage.dto.EstimateResponse;
import com.example.vehicledamage.model.Claim;
import com.example.vehicledamage.model.LineItem;
import com.example.vehicledamage.repository.LineItemRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@AllArgsConstructor
public class CostEngineService {

    private final LineItemRepository lineItemRepository;
    private final MockCatalogService mockCatalogService;

    private static final Set<String> REPLACE_DAMAGE_TYPES = Set.of(
            "damage", "glass-break", "shatter", "missing", "broken",
            "car_window_damage", "front_windscreen_damage", "rear_windscreen_damage",
            "headlight_damage", "taillight_damage", "tire_flat", "crack", "glass-crack"
    );

    @Transactional
    public EstimateResponse calculateAndSaveEstimate(AnalysisResponse analysisResponse, Claim claim) {

        List<EstimateResponse.LineItem> lineItemsDto = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        // 🟢 1. Get Luxury Factor (Default to 1.0 if missing)
        BigDecimal luxuryFactor = claim.getLuxuryFactor() != null ? claim.getLuxuryFactor() : BigDecimal.ONE;

        // ---------------------------------------------------------------------
        // STEP 1: CALCULATE BASE COSTS & SAVE LINE ITEMS
        // ---------------------------------------------------------------------
        for (AnalysisResponse.DamageLocation loc : analysisResponse.getDamageLocations()) {

            DamageInfo damageInfo = parseLabel(loc.getLocation());
            MockCatalogService.PartCost partCost = mockCatalogService.getPartCost(damageInfo.partName());

            boolean replace = shouldReplace(damageInfo.damageType(), loc.getConfidence());
            String action = replace ? "Replace" : "Repair + Paint";

            if (damageInfo.partName().contains("windscreen") ||
                    damageInfo.partName().contains("window") ||
                    damageInfo.partName().equals("glass") ||
                    damageInfo.partName().equals("tire")) {
                action = "Replace";
                replace = true;
            }

            // 🟢 2. Pass Luxury Factor to calculation
            BigDecimal lineItemCost = calculateLineItemCost(replace, partCost, loc.getConfidence(), luxuryFactor);

            subtotal = subtotal.add(lineItemCost);

            lineItemsDto.add(new EstimateResponse.LineItem(damageInfo.partName(), damageInfo.damageType(), action, lineItemCost));

            LineItem lineItemEntity = new LineItem();
            lineItemEntity.setPart(damageInfo.partName());
            lineItemEntity.setDamageType(damageInfo.damageType());
            lineItemEntity.setAction(action);
            lineItemEntity.setAmount(lineItemCost);
            lineItemEntity.setClaim(claim);
            lineItemRepository.save(lineItemEntity);
        }

        // ---------------------------------------------------------------------
        // STEP 2: NEW TOTAL, DEPRECIATION & TOTAL LOSS LOGIC
        // ---------------------------------------------------------------------

        BigDecimal taxRate = new BigDecimal("0.18");
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal originalTotal = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        BigDecimal deductionAmount = BigDecimal.ZERO;
        StringBuilder deductionReason = new StringBuilder("None"); 

        int vehicleAge = 0;
        if(claim.getYearOfManufacture() != null) {
            vehicleAge = java.time.LocalDateTime.now().getYear() - claim.getYearOfManufacture();
        }

        if (vehicleAge > 3 && (claim.getHasZeroDepreciationCover() == null || !claim.getHasZeroDepreciationCover())) {
            BigDecimal depRate = (vehicleAge > 5) ? new BigDecimal("0.40") : new BigDecimal("0.20"); 
            BigDecimal ageDeduction = subtotal.multiply(depRate).setScale(2, RoundingMode.HALF_UP);

            deductionAmount = deductionAmount.add(ageDeduction);
            deductionReason = new StringBuilder("Age Depreciation (" + (vehicleAge > 5 ? "40%" : "20%") + ")");
        }

        if (claim.getStatus() != null && claim.getStatus().contains("LIMITED")) {
            BigDecimal multiClaimDeduction = originalTotal.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
            deductionAmount = deductionAmount.add(multiClaimDeduction);

            if (deductionReason.toString().equals("None")) {
                deductionReason = new StringBuilder("50% Multiple Claim Penalty");
            } else {
                deductionReason.append(" + 50% Multi-Claim Penalty");
            }
        }

        BigDecimal finalTotal = originalTotal.subtract(deductionAmount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) finalTotal = BigDecimal.ZERO;

        if (claim.getInsuredDeclaredValue() != null && claim.getInsuredDeclaredValue().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal totalLossThreshold = claim.getInsuredDeclaredValue().multiply(new BigDecimal("0.75"));

            if (finalTotal.compareTo(totalLossThreshold) > 0) {
                claim.setStatus("TOTAL_LOSS_DETECTED");
                deductionReason.append(" [TOTAL LOSS: Repair exceeds 75% of IDV]");
            }
        }

        EstimateResponse response = new EstimateResponse();
        response.setLineItems(lineItemsDto);
        response.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        response.setTax(taxAmount);
        response.setOriginalTotal(originalTotal);
        response.setDeductionAmount(deductionAmount);
        response.setDeductionReason(deductionReason.toString());
        response.setTotal(finalTotal);

        return response;
    }

    // ---------------------------------------------------------------------
    // HELPER METHODS
    // ---------------------------------------------------------------------

    // 🟢 3. Updated Calculation Logic
    private BigDecimal calculateLineItemCost(boolean replace, MockCatalogService.PartCost partCost, double confidence, BigDecimal luxuryFactor) {
        BigDecimal baseCost;
        
        if (replace) {
            // Cost = Part MRP + Labor hours * Labor Rate
            baseCost = partCost.mrp().add(
                    partCost.replaceHours().multiply(mockCatalogService.getLaborRate())
            );
        } else {
            // Cost = Labor hours * Labor Rate + Paint Cost
            BigDecimal paintCost = partCost.paintRatePerPercent()
                    .multiply(BigDecimal.valueOf(confidence * 10)); 

            baseCost = partCost.repairHours().multiply(mockCatalogService.getLaborRate())
                    .add(paintCost);
        }
        
        // 🟢 4. Apply Luxury Multiplier
        if (luxuryFactor != null && luxuryFactor.compareTo(BigDecimal.ONE) > 0) {
            return baseCost.multiply(luxuryFactor).setScale(2, RoundingMode.HALF_UP);
        }
        
        return baseCost.setScale(2, RoundingMode.HALF_UP);
    }

    private boolean shouldReplace(String damageType, double confidence) {
        String type = damageType.toLowerCase();
        if (type.contains("glass") || type.contains("windscreen") || type.contains("light") || type.contains("tire")) {
            return true;
        }
        if (REPLACE_DAMAGE_TYPES.contains(type) && confidence > 0.50) {
            return true;
        }
        return confidence > 0.85;
    }

    private DamageInfo parseLabel(String label) {
        String[] parts = label.split("(?<=[_-])(?!.*[_-])");

        if (parts.length > 1) {
            String partName = parts[0];
            String damageType = parts[1];
            partName = partName.replace("_", "-");
            return new DamageInfo(partName, damageType);
        }
        return new DamageInfo("unknown", label);
    }

    private record DamageInfo(String partName, String damageType) {}
}
