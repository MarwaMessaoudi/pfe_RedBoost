package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Entity
@Table(name = "coach_details")
@PrimaryKeyJoinColumn(name = "user_id")
@EqualsAndHashCode(callSuper = true)
public class Coach extends User {

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Size(max = 255)
    @Column(name = "skills")
    private String skills;

    @Size(max = 255)
    @Column(name = "expertise")
    private String expertise;

    @Column(name = "is_binome")
    private boolean isBinome;

    @Column(name = "binome_invitation_token")
    private String binomeInvitationToken;

    @Column(name = "related_binome_coach_id")
    private Long relatedBinomeCoachId;

    @Email
    @Column(name = "binome_email")
    private String binomeEmail;

    @Column(name = "is_certified")
    private Boolean isCertified;

    @Column(name = "total_proposed_fee")
    private Double totalProposedFee;

    @Column(name = "cv_url")
    private String cvUrl;

    @Column(name = "training_program_url")
    private String trainingProgramUrl;

    @OneToMany(mappedBy = "coach", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference // Manage the forward reference
    private List<CertificationDocument> certificationDocuments;

    @Transient
    public List<String> getSkillsList() {
        if (skills == null || skills.trim().isEmpty()) return new ArrayList<>();
        return Arrays.stream(skills.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setSkillsList(List<String> skillsList) {
        if (skillsList == null || skillsList.isEmpty()) {
            this.skills = null;
        } else {
            this.skills = String.join(",", skillsList);
        }
    }

    @Transient
    public List<String> getExpertiseList() {
        if (expertise == null || expertise.trim().isEmpty()) return new ArrayList<>();
        return Arrays.stream(expertise.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setExpertiseList(List<String> expertiseList) {
        if (expertiseList == null || expertiseList.isEmpty()) {
            this.expertise = null;
        } else {
            this.expertise = String.join(",", expertiseList);
        }
    }
}