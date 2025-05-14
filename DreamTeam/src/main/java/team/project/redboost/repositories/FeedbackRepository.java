package team.project.redboost.repositories;

import team.project.redboost.entities.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUser_Id(Long userId); // Trouver les feedbacks d'un utilisateur
}