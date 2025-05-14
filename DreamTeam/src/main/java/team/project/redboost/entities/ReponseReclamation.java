package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table
public class ReponseReclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "idReclamation", nullable = false)
    private Reclamation reclamation;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;  // Référence à l'utilisateur

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Enumerated(EnumType.STRING) // Stocker le rôle de l'envoyeur
    private Role roleEnvoyeur;

    private LocalDateTime dateCreation = LocalDateTime.now();
}