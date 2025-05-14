package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.PhaseRepository;
import team.project.redboost.repositories.ProjetRepository;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class PhaseService {
    @Autowired
    private PhaseRepository phaseRepository;

    @Autowired
    private ProjetRepository projetRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserService userService;

    public void checkUserAuthorizationForProject(Long projetId, String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with ID: " + projetId));
        boolean isEntrepreneur = projet.getEntrepreneurs().stream()
                .anyMatch(u -> u.getId().equals(user.getId()));
        boolean isCoach = projet.getCoaches().stream()
                .anyMatch(u -> u.getId().equals(user.getId()));
        boolean isAuthorized = (user.getRole() == Role.ENTREPRENEUR && isEntrepreneur) ||
                (user.getRole() == Role.COACH && isCoach);
        if (!isAuthorized) {
            throw new SecurityException("User is not authorized for project ID: " + projetId);
        }
    }

    public Phase createPhase(Phase phase, String userEmail) {
        if (phase.getProjet() == null && phase.getProjetId() == null) {
            throw new IllegalArgumentException("Project ID is required for phase creation");
        }
        Long projetId = phase.getProjetId() != null ? phase.getProjetId() : phase.getProjet().getId();
        checkUserAuthorizationForProject(projetId, userEmail);
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with ID: " + projetId));
        phase.setProjet(projet);
        phase.setCreatedAt(LocalDateTime.now());
        phase.setUpdatedAt(LocalDateTime.now());
        return phaseRepository.save(phase);
    }

    public List<Phase> getAllPhases(String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        if (user.getRole() != Role.ENTREPRENEUR && user.getRole() != Role.COACH) {
            throw new SecurityException("User is not authorized to access phases");
        }
        return phaseRepository.findByProjetEntrepreneursOrCoaches(user.getId());
    }

    public Phase getPhaseById(Long phaseId, String userEmail) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new EntityNotFoundException("Phase not found with ID: " + phaseId));
        checkUserAuthorizationForProject(phase.getProjet().getId(), userEmail);
        return phase;
    }

    public Phase updatePhase(Long phaseId, Phase updatedPhase, String userEmail) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new EntityNotFoundException("Phase not found with ID: " + phaseId));
        checkUserAuthorizationForProject(phase.getProjet().getId(), userEmail);
        phase.setPhaseName(updatedPhase.getPhaseName());
        phase.setStatus(updatedPhase.getStatus());
        phase.setStartDate(updatedPhase.getStartDate());
        phase.setEndDate(updatedPhase.getEndDate());
        phase.setDescription(updatedPhase.getDescription());
        phase.setTotalXpPoints(updatedPhase.getTotalXpPoints());
        if (updatedPhase.getProjetId() != null && !phase.getProjet().getId().equals(updatedPhase.getProjetId())) {
            checkUserAuthorizationForProject(updatedPhase.getProjetId(), userEmail);
            Projet projet = projetRepository.findById(updatedPhase.getProjetId())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with ID: " + updatedPhase.getProjetId()));
            phase.setProjet(projet);
        }
        phase.setUpdatedAt(LocalDateTime.now());
        return phaseRepository.save(phase);
    }

    public void deletePhase(Long phaseId, String userEmail) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new EntityNotFoundException("Phase not found with ID: " + phaseId));
        checkUserAuthorizationForProject(phase.getProjet().getId(), userEmail);
        phaseRepository.deleteById(phaseId);
    }

    public List<Phase> getPhasesByDateRange(LocalDate start, LocalDate end, String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        if (user.getRole() != Role.ENTREPRENEUR && user.getRole() != Role.COACH) {
            throw new SecurityException("User is not authorized to access phases");
        }
        return phaseRepository.findByStartDateBetweenAndProjetEntrepreneursOrCoaches(start, end, user.getId());
    }

    public Phase assignTasksToPhase(Long phaseId, List<Task> tasks, String userEmail) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new EntityNotFoundException("Phase not found with ID: " + phaseId));
        checkUserAuthorizationForProject(phase.getProjet().getId(), userEmail);
        for (Task task : tasks) {
            task.setPhase(phase);
            taskService.updateTask(task.getTaskId(), task, userEmail);
        }
        return phaseRepository.save(phase);
    }

    public List<Map<String, Object>> getEntrepreneursByProject(Long projetId) {
        projetRepository.findById(projetId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with ID: " + projetId));
        return phaseRepository.findEntrepreneursByProject(projetId);
    }
}