package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "reaction_messages")
public class ReactionMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @Column(name = "user_id", nullable = false)
    private Long userId; // Store user ID instead of User reference

    @Column(nullable = false)
    private String emoji;
}