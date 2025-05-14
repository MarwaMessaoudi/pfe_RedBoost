package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*; // Import ToString specifically if needed

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data // Includes @ToString by default
@Entity
@Table(name = "activities")
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Activity name is mandatory")
    private String name;
    @Column(name = "color", length = 10) // Exemple avec un code hexadÃ©cimal (#FF0000)
    private String color;


    @Enumerated(EnumType.STRING)
    private ActivityStatus status;

    @NotNull(message = "Start date is mandatory")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is mandatory")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Min(value = 0, message = "Total XP points must be non-negative")
    private int totalXpPoints;

    // --- Fix Here (Also) ---
    @ToString.Exclude // Exclude this collection from Lombok's toString()
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore // Keep for JSON serialization (though JsonBackReference might suffice)
    @JsonBackReference("activityTaskActivities") // Corrected reference name from TaskActivity
    private List<TaskActivity> taskActivities;
    // --- End Fix ---

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Fix Here ---
    @ToString.Exclude // Exclude this field from Lombok's toString()
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = false)
    @JsonBackReference // Keep for JSON serialization
    private Program program;
    // --- End Fix ---


    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Consider removing these if not strictly needed, rely on the 'program' field directly
    // Or make sure they don't trigger lazy loading unnecessarily if kept.
    public Long getProgramId() {
        // Avoid triggering lazy loading just for the ID if possible
        // This might still cause issues if 'program' is a proxy and toString() is called on it elsewhere.
        return program != null ? program.getId() : null;
    }

    public void setProgramId(Long programId) {
        if (programId != null) {
            // Avoid creating a new Program instance if program already exists.
            // This method is generally problematic with JPA. It's better to set the actual Program object.
            if (this.program == null) {
                this.program = new Program();
            }
            // Setting only the ID on a JPA entity like this is usually not recommended.
            // You should fetch the Program entity and set it.
            this.program.setId(programId);
        } else {
            this.program = null;
        }
    }

    public enum ActivityStatus {
        NOT_STARTED, IN_PROGRESS, COMPLETED
    }
}