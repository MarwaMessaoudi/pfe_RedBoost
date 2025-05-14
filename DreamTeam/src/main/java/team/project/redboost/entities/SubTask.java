package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Data
@Entity
@Table(name = "sub_tasks")
public class SubTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subTaskId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @JsonBackReference("taskSubTasks")
    private Task task;

    // Custom toString to avoid circular reference with Task
    @Override
    public String toString() {
        return "SubTask{" +
                "subTaskId=" + subTaskId +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}