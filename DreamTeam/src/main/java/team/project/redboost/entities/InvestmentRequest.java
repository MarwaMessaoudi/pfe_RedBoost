package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InvestmentRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "investor_id", nullable = false)
    @JsonIgnoreProperties("investmentRequests")
    private Investor investor; // Changed from User to Investor

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "projet_id", nullable = false)
    @JsonIgnoreProperties("investmentRequests")
    private Projet projet;

    @Enumerated(EnumType.STRING)
    private InvestmentStatus status;

    private String message;
    private double proposedAmount;
    private LocalDateTime requestDate;

    public InvestmentRequest() {
        this.requestDate = LocalDateTime.now();
        this.status = InvestmentStatus.PENDING;
    }
}