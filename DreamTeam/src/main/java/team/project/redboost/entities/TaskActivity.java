package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode; // Import if needed
import lombok.ToString; // Import
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "task_activities")
public class TaskActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskActivityId;

    // ... other fields ...
    @Column(nullable = false)
    private String title;

    private int xpPoint;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private PriorityActivity priorityActivity;

    @Enumerated(EnumType.STRING)
    private StatusActivity statusActivity;
    // ... other fields end ...

    @ToString.Exclude // <<<--- ADD
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_id", nullable = false)
    @JsonBackReference("activityTaskActivities")
    private Activity activity;

    @ToString.Exclude // <<<--- ADD
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_category_activity_id", nullable = false)
    @JsonBackReference("categoryActivityTasks")
    private TaskCategoryActivity taskCategoryActivity;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ElementCollection
    private List<String> attachments;

    @Transient
    private Long taskCategoryActivityId;

    @ToString.Exclude // <<<--- ADD
    @EqualsAndHashCode.Exclude // Also good practice for collections in equals/hashCode
    @OneToMany(mappedBy = "taskActivity", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("taskActivitySubTasks")
    private List<SubTaskActivity> subTasks = new ArrayList<>();

    @ToString.Exclude // <<<--- ADD
    @EqualsAndHashCode.Exclude // Also good practice for collections in equals/hashCode
    @OneToMany(mappedBy = "taskActivity", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("taskActivityComments")
    private List<CommentActivity> comments = new ArrayList<>();

    // ... enums, methods ...
    public enum PriorityActivity {
        ACTIVITY_LOW, ACTIVITY_MEDIUM, ACTIVITY_HIGH
    }

    public enum StatusActivity {
        TO_DO, IN_PROGRESS, DONE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        setTaskCategoryActivityId(); // Call here if needed on creation
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        // No need to call setTaskCategoryActivityId here unless the category can change
        // and you need the transient field updated immediately after DB update.
    }

    @PostLoad
    protected void loadTaskCategoryActivityId() { // Renamed for clarity
        setTaskCategoryActivityId();
    }

    // Make this private or protected if only used internally
    private void setTaskCategoryActivityId() {
        if (taskCategoryActivity != null) {
            this.taskCategoryActivityId = taskCategoryActivity.getId();
        }
    }

    // Helper method to add a sub-task
    public void addSubTask(SubTaskActivity subTask) {
        subTasks.add(subTask);
        subTask.setTaskActivity(this);
    }

    // Helper method to add a comment
    public void addComment(CommentActivity comment) {
        comments.add(comment);
        comment.setTaskActivity(this);
    }

}