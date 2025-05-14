package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "startup_metrics")
public class StartupMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "projet_id")
    private Projet startup;

    private double satisfaction;
    private double progress;
    private double score;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        EN_BONNE_VOIE("En Bonne Voie"),
        ATTENTION_REQUISE("Attention Requise"),
        EN_RETARD("En Retard");

        private final String label;

        Status(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}