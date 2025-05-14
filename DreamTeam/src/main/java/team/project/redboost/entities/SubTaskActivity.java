package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Data
@Entity
@Table(name = "sub_task_activities")
public class SubTaskActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subTaskActivityId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_activity_id", nullable = false)
    @JsonBackReference("taskActivitySubTasks")
    private TaskActivity taskActivity;

    // Custom toString to avoid circular reference with TaskActivity
    @Override
    public String toString() {
        return "SubTaskActivity{" +
                "subTaskActivityId=" + subTaskActivityId +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}