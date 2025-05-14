package team.project.redboost.dto;

import lombok.Getter;
import lombok.Setter;
import team.project.redboost.entities.CategorieReclamation;

@Getter
@Setter
public class ReclamationDTO {
    private String nom; // Not used in entity but sent from frontend
    private String email; // Not used in entity but sent from frontend
    private String sujet;
    private String description;
    private CategorieReclamation categorie;
    private String date; // Frontend date string
}