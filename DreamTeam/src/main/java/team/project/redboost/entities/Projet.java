package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties({"entrepreneurs", "produits", "services", "founder", "pendingCollaborator"})
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // New fields for Google Drive folder IDs
    private String driveFolderId;
    private String accompagnementFolderId;

    private String name;
    private String sector;
    private String type;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonSerialize(using = LocalDateSerializer.class)
    private LocalDate creationDate;
    private String description;

    @Enumerated(EnumType.STRING)
    private Objectives objectives;

    @Enumerated(EnumType.STRING)
    private Statut status;

    private Double globalScore;
    private String location;

    @Column(length = 500)
    private String logoUrl;

    private String websiteUrl;
    private Double revenue;
    private Long numberOfEmployees;
    private Long nbFemaleEmployees;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonSerialize(using = LocalDateSerializer.class)
    private LocalDate lastUpdated;
    private String associatedSectors;
    private String technologiesUsed;
    private Double fundingGoal;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonSerialize(using = LocalDateSerializer.class)
    private LocalDate lastEvaluationDate;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "projet_id")
    private List<Produit> produits = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "projet_id")
    private List<ServiceP> services = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "projet_entrepreneur",
            joinColumns = @JoinColumn(name = "projet_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonIgnoreProperties("projets")
    private List<User> entrepreneurs = new ArrayList<>();

    @ManyToMany
    @JsonBackReference
    @JoinTable(
            name = "projet_coach",
            joinColumns = @JoinColumn(name = "projet_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> coaches = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "projet_investor",
            joinColumns = @JoinColumn(name = "projet_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> investors = new ArrayList<>();

    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Phase> phases = new ArrayList<>();

    // Track the initiator (owner) of the project
    @ManyToOne
    @JoinColumn(name = "founder_id", nullable = false)
    @JsonIgnoreProperties("projets")
    private User founder;

    // Optional: Track a pending collaborator (nullable, set only when inviting)
    @ManyToOne
    @JoinColumn(name = "pending_collaborator_id")
    @JsonIgnoreProperties("projets")
    private User pendingCollaborator;

    public enum Statut {
        EN_DEVELOPPEMENT, OPERATIONNELLE, EN_RECHERCHE_FINANCEMENT, TERMINE
    }

    public enum Objectives {
        COURT_TERME, MOYEN_TERME, LONG_TERME
    }

    public Projet(String name, String logoUrl, String websiteUrl, LocalDate creationDate) {
        this.name = name;
        this.logoUrl = logoUrl;
        this.websiteUrl = websiteUrl;
        this.creationDate = creationDate;
    }
}