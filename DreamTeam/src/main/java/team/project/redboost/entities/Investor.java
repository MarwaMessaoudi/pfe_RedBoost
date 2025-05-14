package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Setter
@Getter
@Data
@Entity
@Table(name = "investor")
@PrimaryKeyJoinColumn(name = "user_id") // Maps to the primary key of the User table
@EqualsAndHashCode(callSuper = true)  // Ensures superclass is included
public class Investor extends User {

    private String legalRepresentative; // Le représentant légal (Legal representative)
    private String governorate; // Gouvernorat (Region/State)
    private String address; // Adresse (Physical address)
    private String uniqueIdentifier; // Identifiant unique (Tax ID or Registration Number)
    private String legalForm; // Forme juridique (Legal form, e.g., SARL, SA)
    private Double shareCapital; // Capital social (Share capital)

    @OneToMany(mappedBy = "investor", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("investor")
    private List<InvestmentRequest> investmentRequests;

    public Investor() {}

    public Investor( String legalRepresentative,
                    String governorate, String address, String uniqueIdentifier,
                    String legalForm, Double shareCapital) {

        this.legalRepresentative = legalRepresentative;
        this.governorate = governorate;
        this.address = address;
        this.uniqueIdentifier = uniqueIdentifier;
        this.legalForm = legalForm;
        this.shareCapital = shareCapital;
    }
}