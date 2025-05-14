package team.project.redboost.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "coach_requests")
public class CoachRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 2, max = 100)
    private String firstName;

    @NotBlank
    @Size(min = 2, max = 100)
    private String lastName;

    @Email
    @NotBlank
    private String email;

    private String phoneNumber;

    private Integer yearsOfExperience;

    @Size(max = 255)
    private String skills;

    @Size(max = 255)
    private String expertise;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private LocalDateTime createdAt;

    @Column(name = "is_binome")
    private boolean isBinome;

    @Column(name = "binome_invitation_token")
    private String binomeInvitationToken;

    @Column(name = "related_binome_request_id")
    private Long relatedBinomeRequestId;

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

    @OneToMany(mappedBy = "coachRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CertificationDocument> certificationDocuments;
}