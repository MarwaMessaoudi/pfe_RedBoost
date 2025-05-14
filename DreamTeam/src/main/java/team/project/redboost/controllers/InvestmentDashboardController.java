// team/project/redboost/controllers/InvestmentDashboardController.java
package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.InvestmentDTO;
import team.project.redboost.dto.InvestmentKpisDTO;
import team.project.redboost.dto.MonthlyDataDTO;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;
import team.project.redboost.services.InvestmentDashboardService;
import team.project.redboost.services.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
public class InvestmentDashboardController {

    @Autowired
    private InvestmentDashboardService investmentDashboardService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<InvestmentDTO>> getInvestments(Authentication authentication) {
        User investor = getCurrentInvestor(authentication);
        List<InvestmentDTO> investments = investmentDashboardService.getInvestmentsByInvestor(investor.getId());
        return ResponseEntity.ok(investments);
    }

    @GetMapping("/kpis")
    public ResponseEntity<InvestmentKpisDTO> getInvestmentKpis(Authentication authentication) {
        User investor = getCurrentInvestor(authentication);
        InvestmentKpisDTO kpis = investmentDashboardService.getInvestmentKpis(investor.getId());
        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlyDataDTO>> getMonthlyInvestmentData(Authentication authentication) {
        User investor = getCurrentInvestor(authentication);
        List<MonthlyDataDTO> monthlyData = investmentDashboardService.getMonthlyInvestmentData(investor.getId());
        return ResponseEntity.ok(monthlyData);
    }

    private User getCurrentInvestor(Authentication authentication) {
        String email = authentication.getName();
        User investor = userService.findByEmail(email);

        if (investor == null || investor.getRole() != Role.INVESTOR) {
            throw new RuntimeException("Current user is not an investor");
        }

        return investor;
    }
}