package team.project.redboost.entities;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*; // Import ToString specifically if needed

import java.time.LocalDate;
import java.util.List;
import team.project.redboost.entities.ProgramStatus;

@Data // Includes @ToString by default
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table
public class Program {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double budget;
    private String logoUrl;

    @ManyToOne
    @JoinColumn(name = "program_lead_id", nullable = false)
    private User programLead; // Assuming User entity exists and doesn't cause cycles

    @Enumerated(EnumType.STRING)
    private ProgramStatus status;

    // --- Fix Here ---
    @ToString.Exclude // Exclude this collection from Lombok's toString()
    @JsonIgnore // Keep for JSON serialization
    @OneToMany(mappedBy = "program", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true) // Added cascade/orphanRemoval often needed
    @JsonManagedReference // Keep for JSON serialization
    private List<Activity> activities;
    // --- End Fix ---
}