package team.project.redboost.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "evaluation_forms")
public class EvaluationForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nom et prénom is mandatory")
    private String nomPrenom; // Consider fetching from User entity later if needed

    @NotBlank(message = "Projet is mandatory")
    private String projetName; // Storing name, or linking to Projet entity is better

    @NotNull(message = "Satisfaction globale is mandatory")
    @Enumerated(EnumType.STRING)
    private Satisfaction satisfactionGlobale;
    public enum Satisfaction { TRES_SATISFAIT, SATISFAIT, INSATISFAIT }

    @NotNull(message = "Réponse aux attentes is mandatory")
    @Enumerated(EnumType.STRING)
    private AttenteReponse attentesReponse;
    public enum AttenteReponse { MOYEN, ELEVE, TRES_ELEVE }

    @NotNull(message = "Qualité du coach RedStart is mandatory")
    @Enumerated(EnumType.STRING)
    private RedStartCoachQualite redStartCoachQualite;
    public enum RedStartCoachQualite { FAIBLE, MOYEN, ELEVE, TRES_ELEVE }

    @NotNull(message = "Ambiance générale is mandatory")
    @Enumerated(EnumType.STRING)
    private AmbianceGenerale ambianceGenerale;
    public enum AmbianceGenerale { FAIBLE, MOYEN, ELEVE, TRES_ELEVE }

    @Lob
    private String pointsForts;

    @Lob
    private String pointsFaibles;

    @NotNull(message = "Compétences du coach is mandatory")
    @Enumerated(EnumType.STRING)
    private CoachCompetence coachCompetence;
    public enum CoachCompetence { TRES_COMPETENT, COMPETENT, MOYENNEMENT_COMPETENT }

    @NotNull(message = "Compréhension du coach is mandatory")
    @Enumerated(EnumType.STRING)
    private CoachComprehension coachComprehension;
    public enum CoachComprehension { TRES_BIEN, BIEN, PAS_TRES_BIEN }

    @NotNull(message = "Qualité de la communication is mandatory")
    @Enumerated(EnumType.STRING)
    private CommunicationQualite communicationQualite;
    public enum CommunicationQualite { EXCELLENTE, ELEVE, TRES_ELEVE }

    @Lob
    private String autreCommentaire;

    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    // Link to the User who submitted the form
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Link to the Phase being evaluated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phase_id", nullable = false)
    private Phase phase;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }

    // Lombok's @Data adds getters, setters, equals, hashCode, toString, and a default constructor
    // If needed, manually add an explicit default constructor: public EvaluationForm() {}
}