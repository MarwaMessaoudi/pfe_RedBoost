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
    private String email;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String heure;

    @Column(nullable = false, length = 500)
    private String description;


    private String meetingLink; // Nouveau champ pour le lien Google Meet

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING; // Valeur par défaut "PENDING"

    public RendezVous(Long id, String title, String description, String date, String heure, String email, Coach coach, Entrepreneur entrepreneur) {
    }

    public void setCoach(Coach coach) {
        this.coach = coach;
    }

    public void setEntrepreneur(Entrepreneur entrepreneur) {
        this.entrepreneur = entrepreneur;
    }

    @ManyToOne
    @JoinColumn(name = "coach_id", nullable = false)
    private Coach coach; // Relationship to Coach

    public Coach getCoach() {
        return coach;
    }

    public Entrepreneur getEntrepreneur() {
        return entrepreneur;
    }

    @ManyToOne
    @JoinColumn(name = "entrepreneur_id", nullable = false)
    private Entrepreneur entrepreneur; // Relationship to Entrepreneur
    // Enum pour les statuts
    public enum Status {
        PENDING, ACCEPTED, REJECTED
    }

    // Getters et setters existants restent inchangés, sauf pour status
    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getHeure() {
        return heure;
    }

    public void setHeure(String heure) {
        this.heure = heure;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMeetingLink() {
        return meetingLink;
    }

    public void setMeetingLink(String meetingLink) {
        this.meetingLink = meetingLink;
    }
}