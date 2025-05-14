// team/project/redboost/services/StartupDashboardService.java
package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.dto.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.ProjetRepository;
import team.project.redboost.repositories.TaskRepository;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StartupDashboardService {

    @Autowired
    private ProjetRepository projetRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserService userService;

    public List<StartupKpiDTO> getStartupKpis(Long entrepreneurId) {
        Projet projet = getEntrepreneurProject(entrepreneurId);

        // Calculate KPIs based on project data
        double ddlCompliance = calculateDdlCompliance(projet);
        double globalProgress = calculateGlobalProgress(projet);
        double avgTaskTime = calculateAverageTaskTime(projet);
        double objectiveCompliance = calculateObjectiveCompliance(projet);
        double fundsRaised = projet.getFundingGoal() != null ?
                (projet.getRevenue() != null ? projet.getRevenue() / projet.getFundingGoal() * 100 : 0) : 0;
        double growthRate = calculateGrowthRate(projet);

        return Arrays.asList(
                new StartupKpiDTO("Respect de DDL des Tâches", String.format("%.0f%%", ddlCompliance),
                        "Tâches terminées à temps", (int) ddlCompliance),
                new StartupKpiDTO("Avancement Global", String.format("%.0f%%", globalProgress),
                        "Tâches terminées", (int) globalProgress),
                new StartupKpiDTO("Temps Moyen par Tâche", String.format("%.1fh", avgTaskTime),
                        "Temps moyen pour la réalisation des tâches", (int) (avgTaskTime * 20)), // Scale for progress circle
                new StartupKpiDTO("Respect des Objectifs", String.format("%.0f%%", objectiveCompliance),
                        "Objectifs de vente atteints", (int) objectiveCompliance),
                new StartupKpiDTO("Levée de Fonds", String.format("$%.1fk", fundsRaised/1000),
                        "Fonds levés ce trimestre", (int) fundsRaised),
                new StartupKpiDTO("Taux de Croissance", String.format("%.0f%%", growthRate),
                        "Croissance des startups", (int) growthRate)
        );
    }

    public List<TaskDTO> getTasks(Long entrepreneurId) {
        Projet projet = getEntrepreneurProject(entrepreneurId);

        return projet.getPhases().stream()
                .flatMap(phase -> phase.getTasks().stream())
                .map(task -> new TaskDTO(
                        task.getTitle(),
                        task.getDescription(),
                        calculateTaskProgress(task),
                        "#0A4955",
                        "linear-gradient(90deg, #0A4955, #1C7C7C)",
                        getTaskStatus(task)
                ))
                .collect(Collectors.toList());
    }

    public TaskStatsDTO getTaskStats(Long entrepreneurId) {
        Projet projet = getEntrepreneurProject(entrepreneurId);

        List<Task> allTasks = projet.getPhases().stream()
                .flatMap(phase -> phase.getTasks().stream())
                .collect(Collectors.toList());

        long completedTasks = allTasks.stream()
                .filter(task -> task.getStatus() == Task.Status.DONE)
                .count();

        long pendingTasks = allTasks.stream()
                .filter(task -> task.getStatus() != Task.Status.DONE)
                .count();

        double averageProgress = allTasks.stream()
                .mapToInt(this::calculateTaskProgress)
                .average()
                .orElse(0.0);

        long overdueTasks = allTasks.stream()
                .filter(task -> task.getEndDate() != null &&
                        task.getEndDate().isBefore(LocalDate.now()) &&
                        task.getStatus() != Task.Status.DONE)
                .count();

        return new TaskStatsDTO(completedTasks, pendingTasks, averageProgress, overdueTasks);
    }

    public List<RevenueDataDTO> getRevenueData(Long entrepreneurId) {
        Projet projet = getEntrepreneurProject(entrepreneurId);

        // This would ideally come from a more sophisticated revenue tracking system
        // For now, we'll simulate some data based on project revenue
        return Arrays.asList(
                new RevenueDataDTO("Jan", projet.getRevenue() * 0.1),
                new RevenueDataDTO("Feb", projet.getRevenue() * 0.15),
                new RevenueDataDTO("Mar", projet.getRevenue() * 0.25),
                new RevenueDataDTO("Apr", projet.getRevenue() * 0.35),
                new RevenueDataDTO("May", projet.getRevenue() * 0.5),
                new RevenueDataDTO("Jun", projet.getRevenue() * 0.7),
                new RevenueDataDTO("Jul", projet.getRevenue())
        );
    }

    private Projet getEntrepreneurProject(Long entrepreneurId) {
        return projetRepository.findByEntrepreneursId(entrepreneurId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No project found for entrepreneur"));
    }

    private double calculateDdlCompliance(Projet projet) {
        List<Task> allTasks = projet.getPhases().stream()
                .flatMap(phase -> phase.getTasks().stream())
                .collect(Collectors.toList());

        long onTimeTasks = allTasks.stream()
                .filter(task -> task.getStatus() == Task.Status.DONE &&
                        (task.getEndDate() == null || !task.getEndDate().isBefore(LocalDate.now())))
                .count();

        return allTasks.isEmpty() ? 0 : (onTimeTasks * 100.0 / allTasks.size());
    }

    private double calculateGlobalProgress(Projet projet) {
        return projet.getPhases().stream()
                .mapToDouble(phase -> {
                    if (phase.getTasks().isEmpty()) return 0;
                    return phase.getTasks().stream()
                            .mapToInt(this::calculateTaskProgress)
                            .average()
                            .orElse(0);
                })
                .average()
                .orElse(0);
    }

    private double calculateAverageTaskTime(Projet projet) {
        return 3.2; // Placeholder - would come from time tracking system
    }

    private double calculateObjectiveCompliance(Projet projet) {
        return 90.0; // Placeholder - would come from sales/objective tracking
    }

    private double calculateGrowthRate(Projet projet) {
        return 15.0; // Placeholder - would come from analytics
    }

    private int calculateTaskProgress(Task task) {
        if (task.getStatus() == Task.Status.DONE) return 100;
        if (task.getStatus() == Task.Status.IN_PROGRESS) return 50;
        return 0;
    }

    private String getTaskStatus(Task task) {
        if (task.getStatus() == Task.Status.DONE) return "Completed";
        if (task.getEndDate() != null && task.getEndDate().isBefore(LocalDate.now())) {
            return "Overdue";
        }
        return "In Progress";
    }
}