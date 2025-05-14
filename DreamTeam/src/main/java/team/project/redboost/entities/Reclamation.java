package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonBackReference; // Import!
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idReclamation;




    @NotNull(message = "Le sujet est obligatoire")
    private String sujet;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    @Temporal(TemporalType.TIMESTAMP)

    @NotNull(message = "La date est obligatoire")
    private Date date;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le statut est obligatoire")
    private StatutReclamation statut;

    @Column(length = 1000)
    @NotNull(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "La catégorie est obligatoire")
    @Enumerated(EnumType.STRING)
    private CategorieReclamation categorie;

    @Lob
    private byte[] fichierReclamation;

    @JsonIgnore // Empêche la sérialisation des réponses
    @OneToMany(mappedBy = "reclamation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReponseReclamation> reponses;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false) // Foreign key to User table
    @JsonBackReference // Skip serializing this
    private User user;

    public @NotNull(message = "La catégorie est obligatoire") CategorieReclamation getCategorie() {
        return categorie;
    }

    public void setCategorie(@NotNull(message = "La catégorie est obligatoire") CategorieReclamation categorie) {
        this.categorie = categorie;
    }
}