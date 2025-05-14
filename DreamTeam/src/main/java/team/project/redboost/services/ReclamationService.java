package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Reclamation;
import team.project.redboost.entities.User;
import team.project.redboost.entities.StatutReclamation; // Import the enum!
import team.project.redboost.repositories.ReclamationRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ReclamationService {

    @Autowired
    private ReclamationRepository reclamationRepository;

    // Create a new reclamation
    public Reclamation createReclamation(Reclamation reclamation) {
        return reclamationRepository.save(reclamation);
    }

    // Get all reclamations for a specific user (by user ID)
    public List<Reclamation> getReclamationsByUserId(Long userId) {
        return reclamationRepository.findByUser_Id(userId); // Assuming User has an 'id' field
    }

    // Get all reclamations for a specific user (by user object)
    public List<Reclamation> getReclamationsByUser(User user) {
        return reclamationRepository.findByUser(user);
    }

    // Get all reclamations (for ADMIN only)
    public List<Reclamation> getAllReclamations() {
        return reclamationRepository.findAll();
    }

    // Get a reclamation by ID and user
    public Reclamation getReclamationByIdAndUser(Long idReclamation, User user) {
        Optional<Reclamation> reclamation = reclamationRepository.findByIdReclamationAndUser(idReclamation, user);
        return reclamation.orElse(null);
    }

    // Update a reclamation
    public Reclamation updateReclamation(Long id, Reclamation reclamationDetails, User user) {
        Optional<Reclamation> reclamationOptional = reclamationRepository.findByIdReclamationAndUser(id, user);
        if (reclamationOptional.isPresent()) {
            Reclamation reclamation = reclamationOptional.get();
            reclamation.setSujet(reclamationDetails.getSujet());
            reclamation.setDate(reclamationDetails.getDate());
            reclamation.setStatut(reclamationDetails.getStatut());
            reclamation.setDescription(reclamationDetails.getDescription());
            reclamation.setCategorie(reclamationDetails.getCategorie());
            reclamation.setFichierReclamation(reclamationDetails.getFichierReclamation());
            return reclamationRepository.save(reclamation);
        } else {
            return null;
        }
    }

    // Delete a reclamation
    public boolean deleteReclamation(Long id, User user) {
        Optional<Reclamation> reclamationOptional = reclamationRepository.findByIdReclamationAndUser(id, user);
        if (reclamationOptional.isPresent()) {
            reclamationRepository.delete(reclamationOptional.get());
            return true;
        } else {
            return false;
        }
    }

    // Update reclamation status
    public Reclamation updateReclamationStatut(Long idReclamation, StatutReclamation nouveauStatut) {
        return reclamationRepository.findById(idReclamation)
                .map(reclamation -> {
                    reclamation.setStatut(nouveauStatut);
                    return reclamationRepository.save(reclamation);
                })
                .orElse(null);
    }
}