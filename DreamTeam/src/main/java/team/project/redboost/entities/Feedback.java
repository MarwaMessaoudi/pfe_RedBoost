package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int rating; // 1 (triste) à 5 (heureux)

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    // Relation ManyToOne avec User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Champ optionnel pour des commentaires
    @Column(length = 500)
    private String comment;

    // Constructeur par défaut pour JPA
    public Feedback() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructeur pratique
    public Feedback(int rating, User user) {
        this.rating = rating;
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }
}