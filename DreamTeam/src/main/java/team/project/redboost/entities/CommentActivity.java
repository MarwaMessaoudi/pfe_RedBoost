package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "comment_activities")
public class CommentActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentActivityId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_activity_id", nullable = false)
    @JsonBackReference("taskActivityComments")
    private TaskActivity taskActivity;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}