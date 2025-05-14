// team/project/redboost/controllers/StartupDashboardController.java
package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.*;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;
import team.project.redboost.services.StartupDashboardService;
import team.project.redboost.services.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/startup-dashboard")
public class StartupDashboardController {

    @Autowired
    private StartupDashboardService startupDashboardService;

    @Autowired
    private UserService userService;

    @GetMapping("/kpis")
    public ResponseEntity<List<StartupKpiDTO>> getStartupKpis(Authentication authentication) {
        User entrepreneur = getCurrentEntrepreneur(authentication);
        List<StartupKpiDTO> kpis = startupDashboardService.getStartupKpis(entrepreneur.getId());
        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDTO>> getTasks(Authentication authentication) {
        User entrepreneur = getCurrentEntrepreneur(authentication);
        List<TaskDTO> tasks = startupDashboardService.getTasks(entrepreneur.getId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/task-stats")
    public ResponseEntity<TaskStatsDTO> getTaskStats(Authentication authentication) {
        User entrepreneur = getCurrentEntrepreneur(authentication);
        TaskStatsDTO stats = startupDashboardService.getTaskStats(entrepreneur.getId());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<RevenueDataDTO>> getRevenueData(Authentication authentication) {
        User entrepreneur = getCurrentEntrepreneur(authentication);
        List<RevenueDataDTO> revenueData = startupDashboardService.getRevenueData(entrepreneur.getId());
        return ResponseEntity.ok(revenueData);
    }

    private User getCurrentEntrepreneur(Authentication authentication) {
        String email = authentication.getName();
        User entrepreneur = userService.findByEmail(email);

        if (entrepreneur == null || entrepreneur.getRole() != Role.ENTREPRENEUR) {
            throw new RuntimeException("Current user is not an entrepreneur");
        }

        return entrepreneur;
    }
}