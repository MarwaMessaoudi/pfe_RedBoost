package team.project.redboost.dto;

import team.project.redboost.entities.StatutReclamation;

public class StatutReclamationDTO {
    private Long idReclamation; // Add the ID here
    private StatutReclamation statut;

    public Long getIdReclamation() {
        return idReclamation;
    }

    public void setIdReclamation(Long idReclamation) {
        this.idReclamation = idReclamation;
    }

    public StatutReclamation getStatut() {
        return statut;
    }

    public void setStatut(StatutReclamation statut) {
        this.statut = statut;
    }
}