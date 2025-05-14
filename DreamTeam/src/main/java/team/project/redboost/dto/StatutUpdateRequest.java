package team.project.redboost.dto;

import team.project.redboost.entities.StatutReclamation;

public class StatutUpdateRequest {
    private StatutReclamation statut;

    public StatutReclamation getStatut() {
        return statut;
    }

    public void setStatut(StatutReclamation statut) {
        this.statut = statut;
    }
}