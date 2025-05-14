package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.services.CoachDashboardService;
import team.project.redboost.entities.Kpi;
import team.project.redboost.entities.StartupMetrics;

import java.util.List;

@RestController
@RequestMapping("/api/coach")
@CrossOrigin(origins = "http://localhost:4200")
public class CoachDashboardController {

    @Autowired
    private CoachDashboardService dashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<List<Kpi>> getCoachKPIs(Authentication authentication) {
        String email = authentication.getName();
        List<Kpi> kpis = dashboardService.getKPIsForCoach(email);
        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/startups")
    public ResponseEntity<List<StartupMetrics>> getCoachStartups(Authentication authentication) {
        String email = authentication.getName();
        List<StartupMetrics> startups = dashboardService.getStartupsForCoach(email);
        return ResponseEntity.ok(startups);
    }

}