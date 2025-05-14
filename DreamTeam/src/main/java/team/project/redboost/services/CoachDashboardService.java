package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.util.ArrayList;
import java.util.List;

@Service
public class CoachDashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KPIRepository kpiRepository;

    @Autowired
    private StartupMetricsRepository startupMetricsRepository;

    public List<Kpi> getKPIsForCoach(String email) {
        Coach coach = (Coach) userRepository.findByEmail(email);
        if (coach == null) {
            throw new RuntimeException("Coach not found");
        }

        // Calculate KPIs
        List<Kpi> kpis = new ArrayList<>();

        // Total Startups KPI
        Kpi totalStartups = new Kpi();
        totalStartups.setTitle("Total Startups");
        totalStartups.setValue(String.valueOf(coach.getCoachProjects().size()));
        totalStartups.setDescription("Total number of startups being coached");
        totalStartups.setProgress(100);
        kpis.add(totalStartups);

        // Average Progress KPI
        Kpi avgProgress = new Kpi();
        avgProgress.setTitle("Average Progress");
        double progress = startupMetricsRepository.findByStartupIn(coach.getCoachProjects())
                .stream()
                .mapToDouble(StartupMetrics::getProgress)
                .average()
                .orElse(0.0);
        avgProgress.setValue(String.format("%.1f%%", progress));
        avgProgress.setDescription("Average progress across all startups");
        avgProgress.setProgress((int) progress);
        kpis.add(avgProgress);

        // Average Satisfaction KPI
        Kpi avgSatisfaction = new Kpi();
        avgSatisfaction.setTitle("Satisfaction Rate");
        double satisfaction = startupMetricsRepository.findByStartupIn(coach.getCoachProjects())
                .stream()
                .mapToDouble(StartupMetrics::getSatisfaction)
                .average()
                .orElse(0.0);
        avgSatisfaction.setValue(String.format("%.1f%%", satisfaction));
        avgSatisfaction.setDescription("Average satisfaction rate");
        avgSatisfaction.setProgress((int) satisfaction);
        kpis.add(avgSatisfaction);

        return kpis;
    }

    public List<StartupMetrics> getStartupsForCoach(String email) {
        Coach coach = (Coach) userRepository.findByEmail(email);
        if (coach == null) {
            throw new RuntimeException("Coach not found");
        }

        return startupMetricsRepository.findByStartupIn(coach.getCoachProjects());
    }
}