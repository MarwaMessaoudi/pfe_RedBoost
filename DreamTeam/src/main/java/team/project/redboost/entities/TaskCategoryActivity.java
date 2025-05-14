package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.List;

@Data
@Entity
@Table(name = "task_category_activities") // Avoids conflict with reserved keywords
public class TaskCategoryActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @OneToMany(mappedBy = "taskCategoryActivity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("categoryActivityTasks") // Manages serialization to avoid infinite recursion
    private List<TaskActivity> taskActivities;
}