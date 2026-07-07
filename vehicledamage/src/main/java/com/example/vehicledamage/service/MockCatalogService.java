package com.example.vehicledamage.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import static java.util.Map.entry;

@Service
public class MockCatalogService {

    // 🟢 REALISTIC LABOR RATE: ₹450 per hour (Average Indian Garage)
    private static final BigDecimal LABOR_RATE_PER_HOUR = new BigDecimal("450.00");

    // 🟢 REALISTIC BASE PRICES (INR) for a Standard Hatchback (e.g., Swift/i10)
    // These prices will be multiplied by the 'Luxury Factor' in the CostEngine
    private static final Map<String, PartCost> partCatalog = Map.ofEntries(
            // Part Name      |  MRP (₹)   | Repair Hrs | Replace Hrs | Paint Cost
            entry("front-bumper", new PartCost(new BigDecimal("3500.00"), new BigDecimal("3.0"), new BigDecimal("1.0"), new BigDecimal("1500.00"))),
            entry("rear-bumper",  new PartCost(new BigDecimal("3200.00"), new BigDecimal("3.0"), new BigDecimal("1.0"), new BigDecimal("1500.00"))),
            entry("bumper",       new PartCost(new BigDecimal("3350.00"), new BigDecimal("3.0"), new BigDecimal("1.0"), new BigDecimal("1500.00"))),
            
            entry("headlight",    new PartCost(new BigDecimal("4200.00"), new BigDecimal("0.5"), new BigDecimal("0.5"), new BigDecimal("0.00"))),
            entry("taillight",    new PartCost(new BigDecimal("2800.00"), new BigDecimal("0.5"), new BigDecimal("0.5"), new BigDecimal("0.00"))),
            entry("signlight",    new PartCost(new BigDecimal("850.00"),  new BigDecimal("0.4"), new BigDecimal("0.4"), new BigDecimal("0.00"))),
            
            entry("fender",       new PartCost(new BigDecimal("2500.00"), new BigDecimal("2.5"), new BigDecimal("1.5"), new BigDecimal("1800.00"))),
            entry("door",         new PartCost(new BigDecimal("8500.00"), new BigDecimal("4.5"), new BigDecimal("2.0"), new BigDecimal("2500.00"))),
            entry("trunk_door",   new PartCost(new BigDecimal("9000.00"), new BigDecimal("4.0"), new BigDecimal("2.0"), new BigDecimal("2500.00"))),
            
            entry("bonnet",       new PartCost(new BigDecimal("7500.00"), new BigDecimal("3.5"), new BigDecimal("1.5"), new BigDecimal("2200.00"))),
            entry("roof",         new PartCost(new BigDecimal("12000.00"), new BigDecimal("6.0"), new BigDecimal("4.0"), new BigDecimal("3000.00"))),
            
            entry("pillar",       new PartCost(new BigDecimal("4500.00"), new BigDecimal("5.0"), new BigDecimal("3.0"), new BigDecimal("1500.00"))),
            entry("runningboard", new PartCost(new BigDecimal("2200.00"), new BigDecimal("2.0"), new BigDecimal("1.0"), new BigDecimal("1200.00"))),
            entry("quarter_panel",new PartCost(new BigDecimal("5500.00"), new BigDecimal("5.0"), new BigDecimal("3.0"), new BigDecimal("2000.00"))),
            
            entry("sidemirror",   new PartCost(new BigDecimal("1800.00"), new BigDecimal("0.5"), new BigDecimal("0.5"), new BigDecimal("500.00"))),
            
            // Glass Parts (Usually Replace only)
            entry("front-windscreen", new PartCost(new BigDecimal("6500.00"), new BigDecimal("0.0"), new BigDecimal("2.0"), new BigDecimal("0.00"))),
            entry("rear-windscreen",  new PartCost(new BigDecimal("5500.00"), new BigDecimal("0.0"), new BigDecimal("2.0"), new BigDecimal("0.00"))),
            entry("car_window",       new PartCost(new BigDecimal("2500.00"), new BigDecimal("0.0"), new BigDecimal("1.0"), new BigDecimal("0.00"))),
            entry("glass",            new PartCost(new BigDecimal("2500.00"), new BigDecimal("0.0"), new BigDecimal("1.0"), new BigDecimal("0.00"))),
            
            entry("tire",             new PartCost(new BigDecimal("4500.00"), new BigDecimal("0.0"), new BigDecimal("0.5"), new BigDecimal("0.00")))
    );

    public record PartCost(BigDecimal mrp, BigDecimal repairHours, BigDecimal replaceHours, BigDecimal paintRatePerPercent) {}

    public PartCost getPartCost(String partName) {
        String standardizedPartName = partName.toLowerCase()
                .replace("_", "-")
                .replace("-break", "")
                .replace("-damage", "")
                .replace("-dent", "")
                .replace("-scratch", "");

        if (standardizedPartName.equals("bumper")) {
            return partCatalog.get("bumper");
        }
        if (standardizedPartName.equals("door")) {
            return partCatalog.get("door");
        }

        // Default Fallback Cost (if AI detects something weird)
        return partCatalog.getOrDefault(standardizedPartName,
                new PartCost(new BigDecimal("2000.00"), new BigDecimal("2.0"), new BigDecimal("1.0"), new BigDecimal("1500.00")));
    }

    public BigDecimal getLaborRate() {
        return LABOR_RATE_PER_HOUR;
    }

    public Set<String> getAllParts() {
        return partCatalog.keySet();
    }
}
