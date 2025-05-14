package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.ReponseContenuDTO;
import team.project.redboost.entities.ReponseReclamation;
import team.project.redboost.entities.User;
import team.project.redboost.entities.Reclamation;
import team.project.redboost.entities.Role; // Importer l'énumération Role
import team.project.redboost.services.ReponseReclamationService;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.repositories.ReclamationRepository;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reclamations/{idReclamation}/responses")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ReponseReclamationController {

    private final ReponseReclamationService reponseService;
    private final UserRepository userRepository;
    private final ReclamationRepository reclamationRepository;

    // Récupérer toutes les réponses pour une réclamation
    @GetMapping
    public ResponseEntity<List<ReponseReclamation>> getResponsesByReclamation(@PathVariable Long idReclamation) {
        List<ReponseReclamation> reponses = reponseService.getReponsesByReclamation(idReclamation);
        return ResponseEntity.ok(reponses);
    }

    // Ajouter une nouvelle réponse (gérée en fonction du rôle de l'utilisateur)
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'INVESTOR', 'ENTREPRENEUR', 'COACH', 'ADMIN')")
    public ResponseEntity<?> createReponse(
            @PathVariable Long idReclamation,
            @RequestBody ReponseContenuDTO reponseDTO) {

        // Valider le contenu de la réponse
        if (reponseDTO.getContenu() == null || reponseDTO.getContenu().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Le contenu de la réponse ne peut pas être vide.");
        }

        // Récupérer l'utilisateur authentifié
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName(); // Email de l'utilisateur

        // Récupérer l'utilisateur depuis la base de données
        User user = userRepository.findByEmail(username);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Utilisateur non trouvé.");
        }

        // Vérifier si la réclamation existe
        Optional<Reclamation> reclamationOptional = reclamationRepository.findById(idReclamation);
        if (reclamationOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Réclamation non trouvée.");
        }

        // Créer la réponse avec le rôle de l'utilisateur
        try {
            ReponseReclamation savedReponse = reponseService.createReponse(
                    idReclamation,
                    reponseDTO.getContenu(),
                    user,
                    user.getRole() // Passer le rôle de l'utilisateur
            );
            return new ResponseEntity<>(savedReponse, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la création de la réponse : " + e.getMessage());
        }
    }

    // Mettre à jour une réponse existante (uniquement pour les ADMIN)
    @PutMapping("/{idResponse}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateReponse(
            @PathVariable Long idResponse,
            @RequestBody ReponseReclamation updatedResponse) {
        try {
            ReponseReclamation updated = reponseService.updateReponse(idResponse, updatedResponse);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la mise à jour de la réponse : " + e.getMessage());
        }
    }

    // Supprimer une réponse (uniquement pour les ADMIN)
    @DeleteMapping("/{idResponse}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteReponse(@PathVariable Long idResponse) {
        try {
            boolean isDeleted = reponseService.deleteReponse(idResponse);
            return isDeleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la suppression de la réponse : " + e.getMessage());
        }
    }
}