package team.project.redboost.dto;

import lombok.Data;
import team.project.redboost.entities.Phase;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PhaseDTO {
    private Long phaseId;
    private String phaseName;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private int totalXpPoints;
    private Long projetId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PhaseDTO(Phase phase) {
        this.phaseId = phase.getPhaseId();
        this.phaseName = phase.getPhaseName();
        this.status = phase.getStatus() != null ? phase.getStatus().name() : null;
        this.startDate = phase.getStartDate();
        this.endDate = phase.getEndDate();
        this.description = phase.getDescription();
        this.totalXpPoints = phase.getTotalXpPoints();
        this.projetId = phase.getProjetId();
        this.createdAt = phase.getCreatedAt();
        this.updatedAt = phase.getUpdatedAt();
    }
}