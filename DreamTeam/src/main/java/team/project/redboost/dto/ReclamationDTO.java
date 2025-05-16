package team.project.redboost.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import team.project.redboost.entities.StatutReclamation;
import team.project.redboost.entities.CategorieReclamation;

import java.util.Date;

public class ReclamationDTO {
    private Long idReclamation;
    private String sujet;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private Date date;
    private StatutReclamation statut;
    private String description;
    private CategorieReclamation categorie;
    private String fichierReclamation; // Changed to String to store Cloudinary URL
    private Long userId;
    private String email;
    // Getters and Setters
    public Long getIdReclamation() {
        return idReclamation;
    }

    public void setIdReclamation(Long idReclamation) {
        this.idReclamation = idReclamation;
    }

    public String getSujet() {
        return sujet;
    }

    public void setSujet(String sujet) {
        this.sujet = sujet;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public StatutReclamation getStatut() {
        return statut;
    }

    public void setStatut(StatutReclamation statut) {
        this.statut = statut;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public CategorieReclamation getCategorie() {
        return categorie;
    }

    public void setCategorie(CategorieReclamation categorie) {
        this.categorie = categorie;
    }

    public String getFichierReclamation() {
        return fichierReclamation;
    }

    public void setFichierReclamation(String fichierReclamation) {
        this.fichierReclamation = fichierReclamation;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}