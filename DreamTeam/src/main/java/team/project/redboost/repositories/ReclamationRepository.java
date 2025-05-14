package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Reclamation;
import team.project.redboost.entities.User;

import java.util.List;
import java.util.Optional;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {
    // Find all reclamations for a specific user
    List<Reclamation> findByUser(User user);
    List<Reclamation> findByUser_Id(Long userId);

    // Find a reclamation by ID and user
    Optional<Reclamation> findByIdReclamationAndUser(Long idReclamation, User user);

    // Find all reclamations (provided by default by JpaRepository)
    List<Reclamation> findAll();
}