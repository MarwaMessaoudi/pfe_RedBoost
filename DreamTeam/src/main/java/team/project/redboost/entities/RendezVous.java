package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "rendez_vous")
public class RendezVous {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String heure;

    @Column(nullable = false, length = 500)
    private String description;

    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @ManyToOne
    @JoinColumn(name = "coach_id", nullable = false)
    private Coach coach;

    @ManyToOne
    @JoinColumn(name = "entrepreneur_id", nullable = false)
    private Entrepreneur entrepreneur;

    public enum Status {
        PENDING, ACCEPTED, REJECTED
    }

    // Updated constructor without email
    public RendezVous(Long id, String title, String description, String date, String heure, Coach coach, Entrepreneur entrepreneur) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.date = LocalDate.parse(date);
        this.heure = heure;
        this.coach = coach;
        this.entrepreneur = entrepreneur;
    }
}