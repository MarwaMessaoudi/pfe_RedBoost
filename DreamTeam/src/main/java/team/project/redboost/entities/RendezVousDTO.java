package team.project.redboost.entities;

import java.time.LocalDate;

public class RendezVousDTO {
    private Long id;
    private String title;
    private String email;
    private LocalDate date;
    private String heure;
    private String description;
    private String meetingLink;
    private String status;
    private Long coachId;
    private Long entrepreneurId;
    private boolean canJoinNow; // Indique si le bouton "Rejoindre maintenant" doit être affiché

    // Constructeurs
    public RendezVousDTO() {}

    public RendezVousDTO(Long id, String title, String email, LocalDate date, String heure, String description,
                         String meetingLink, String status, Long coachId, Long entrepreneurId, boolean canJoinNow) {
        this.id = id;
        this.title = title;
        this.email = email;
        this.date = date;
        this.heure = heure;
        this.description = description;
        this.meetingLink = meetingLink;
        this.status = status;
        this.coachId = coachId;
        this.entrepreneurId = entrepreneurId;
        this.canJoinNow = canJoinNow;
    }

    // Getters et setters
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getCoachId() {
        return coachId;
    }

    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }

    public Long getEntrepreneurId() {
        return entrepreneurId;
    }

    public void setEntrepreneurId(Long entrepreneurId) {
        this.entrepreneurId = entrepreneurId;
    }

    public boolean isCanJoinNow() {
        return canJoinNow;
    }

    public void setCanJoinNow(boolean canJoinNow) {
        this.canJoinNow = canJoinNow;
    }


}