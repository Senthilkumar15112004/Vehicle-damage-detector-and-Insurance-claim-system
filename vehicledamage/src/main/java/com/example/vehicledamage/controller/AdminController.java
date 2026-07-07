package com.example.vehicledamage.controller;

import com.example.vehicledamage.dto.ClaimSummaryDto;
import com.example.vehicledamage.model.Claim;
import com.example.vehicledamage.model.User;
import com.example.vehicledamage.repository.ClaimRepository;
import com.example.vehicledamage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;

    // 1. Get All Claims
    @GetMapping("/claims/all")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ClaimSummaryDto>> getAllClaims() {
        List<Claim> allClaims = claimRepository.findAllByOrderByIdDesc();

        List<ClaimSummaryDto> claimSummaries = allClaims.stream()
                .map(claim -> {
                    ClaimSummaryDto dto = new ClaimSummaryDto();
                    dto.setId(claim.getId());
                    dto.setVehicleMakeModel(claim.getVehicleMakeModel());
                    dto.setVehicleRegistrationNumber(claim.getVehicleRegistrationNumber());
                    dto.setCreatedAt(claim.getCreatedAt());
                    dto.setStatus(claim.getStatus());
                    dto.setEstimatedTotal(claim.getEstimatedTotal() != null ? claim.getEstimatedTotal() : BigDecimal.ZERO);

                    if (claim.getUser() != null) {
                        dto.setUserName(claim.getUser().getName());
                        dto.setUserEmail(claim.getUser().getEmail());
                    }
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(claimSummaries);
    }

    // 2. Approve or Reject a Claim
    @PutMapping("/claims/{id}/status")
    @Transactional
    public ResponseEntity<String> updateClaimStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        claim.setStatus(status);
        claimRepository.save(claim);

        return ResponseEntity.ok("Claim status updated to " + status);
    }

    // 3. Get User Stats (All Users + Claim Counts)
    @GetMapping("/users/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getUserStats() {
        List<User> users = userRepository.findAll();
        
        List<Map<String, Object>> userStats = users.stream().map(user -> {
            Map<String, Object> stats = new HashMap<>();
            stats.put("id", user.getId());
            stats.put("name", user.getName());
            stats.put("email", user.getEmail());
            
            // Count claims for this user
            long claimCount = claimRepository.countByUser(user);
            stats.put("claimCount", claimCount);
            
            return stats;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(userStats);
    }
}
