package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Reclamation;
import team.project.redboost.entities.ReponseReclamation;
import team.project.redboost.entities.User;
import team.project.redboost.entities.Role;
import team.project.redboost.repositories.ReclamationRepository;
import team.project.redboost.repositories.ReponseReclamationRepository;
import team.project.redboost.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReponseReclamationService {

    private final ReponseReclamationRepository reponseRepository;
    private final ReclamationRepository reclamationRepository;
    private final UserRepository userRepository;

    // Récupérer toutes les réponses pour une réclamation (triées par date de création)
    public List<ReponseReclamation> getReponsesByReclamation(Long idReclamation) {
        List<ReponseReclamation> reponses = reponseRepository.findByReclamationId(idReclamation);
        reponses.sort((r1, r2) -> r1.getDateCreation().compareTo(r2.getDateCreation()));
        return reponses;
    }

    // Créer une réponse (gérée en fonction du rôle de l'utilisateur)
    public ReponseReclamation createReponse(Long idReclamation, String contenu, User user, Role roleEnvoyeur) {
        // Valider le contenu de la réponse
        if (contenu == null || contenu.trim().isEmpty()) {
            throw new IllegalArgumentException("Le contenu de la réponse ne peut pas être vide.");
        }

        // Trouver la réclamation par son ID
        Optional<Reclamation> reclamationOpt = reclamationRepository.findById(idReclamation);
        if (reclamationOpt.isEmpty()) {
            throw new IllegalArgumentException("Réclamation non trouvée avec l'ID : " + idReclamation);
        }

        // Créer une nouvelle réponse
        ReponseReclamation reponse = new ReponseReclamation();
        reponse.setContenu(contenu); // Définir le contenu de la réponse
        reponse.setUser(user); // Définir l'utilisateur
        reponse.setRoleEnvoyeur(roleEnvoyeur); // Définir le rôle de l'envoyeur
        reponse.setDateCreation(LocalDateTime.now()); // Définir la date de création

        // Associer la réponse à la réclamation
        Reclamation reclamation = reclamationOpt.get();
        reponse.setReclamation(reclamation);

        // Enregistrer la réponse dans la base de données
        return reponseRepository.save(reponse);
    }

    // Mettre à jour une réponse existante
    public ReponseReclamation updateReponse(Long idReponse, ReponseReclamation updatedReponse) {
        // Valider le contenu de la réponse
        if (updatedReponse.getContenu() == null || updatedReponse.getContenu().trim().isEmpty()) {
            throw new IllegalArgumentException("Le contenu de la réponse ne peut pas être vide.");
        }

        // Trouver la réponse existante
        Optional<ReponseReclamation> existingOpt = reponseRepository.findById(idReponse);
        if (existingOpt.isEmpty()) {
            throw new IllegalArgumentException("Réponse non trouvée avec l'ID : " + idReponse);
        }

        // Mettre à jour la réponse
        ReponseReclamation existing = existingOpt.get();
        existing.setContenu(updatedReponse.getContenu()); // Mettre à jour le contenu
        // Ne pas modifier le rôle de l'envoyeur, la réclamation ou l'utilisateur lors de la mise à jour

        // Enregistrer la réponse mise à jour
        return reponseRepository.save(existing);
    }

    // Supprimer une réponse
    public boolean deleteReponse(Long idReponse) {
        if (reponseRepository.existsById(idReponse)) {
            reponseRepository.deleteById(idReponse);
            return true;
        }
        throw new IllegalArgumentException("Réponse non trouvée avec l'ID : " + idReponse);
    }


}