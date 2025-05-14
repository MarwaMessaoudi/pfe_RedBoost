package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "certification_documents")
public class CertificationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_url", nullable = false)
    private String documentUrl;

    @Column(name = "document_name")
    private String documentName;

    @Column(name = "document_type")
    private String documentType;

    @ManyToOne
    @JoinColumn(name = "coach_request_id")
    @JsonIgnore
    private CoachRequest coachRequest;

    @ManyToOne
    @JoinColumn(name = "coach_id")
    @JsonBackReference // Mark as the back reference
    private Coach coach;
}