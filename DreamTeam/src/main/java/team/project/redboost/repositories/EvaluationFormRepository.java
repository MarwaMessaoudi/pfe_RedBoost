package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.EvaluationForm; // Ensure path is correct
import java.util.List;

@Repository
public interface EvaluationFormRepository extends JpaRepository<EvaluationForm, Long> {

    // Find all evaluations submitted by a specific user
    // Assuming User entity has an 'id' property - findByUserId correctly translates to where evaluationForm.user.id = userId
    List<EvaluationForm> findByUserId(Long userId);

    // Check if an evaluation exists for a specific user and phase
    // Corrected previously: existsByUserIdAndPhase_PhaseId -> where evaluationForm.user.id = userId AND evaluationForm.phase.phaseId = phaseId
    boolean existsByUserIdAndPhase_PhaseId(Long userId, Long phaseId);

    // Find evaluations for a specific phase
    // *** FIX: Specify the Phase entity's actual ID property name 'phaseId' using underscore syntax ***
    // Corrected from findByPhaseId to findByPhase_PhaseId
    List<EvaluationForm> findByPhase_PhaseId(Long phaseId); // Corrected: using Phase's 'phaseId' through the 'phase' relationship

}