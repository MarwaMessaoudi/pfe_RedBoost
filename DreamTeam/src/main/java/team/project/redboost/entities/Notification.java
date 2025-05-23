package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // e.g., INVITATION, MESSAGE, PHASE_CREATION

    @Column(nullable = false)
    private Long recipientId;

    @Column
    private Long senderId;

    @Column
    private String content;

    @Column
    private Long conversationId; // For MESSAGE

    @Column
    private Long messageId; // For MESSAGE

    @Column
    private Long projectId; // For INVITATION, PHASE_CREATION

    @Column
    private String projectName; // For INVITATION, PHASE_CREATION

    @Column
    private String invitorEmail; // For INVITATION

    @Column
    private Long phaseId; // For PHASE_CREATION

    @Column
    private String phaseName; // For PHASE_CREATION

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}