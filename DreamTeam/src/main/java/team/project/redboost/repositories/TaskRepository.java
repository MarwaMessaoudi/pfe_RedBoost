package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import team.project.redboost.entities.Task;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByPhase_PhaseId(Long phaseId);
    List<Task> findByTaskCategory_Id(Long categoryId);

    @Query("SELECT t FROM Task t WHERE t.phase.projet IN (SELECT p FROM Projet p WHERE :userId IN (SELECT e.id FROM p.entrepreneurs e) OR :userId IN (SELECT c.id FROM p.coaches c))")
    List<Task> findByProjetEntrepreneursOrCoaches(Long userId);

    @Query("SELECT t FROM Task t WHERE t.taskCategory.id = :categoryId AND t.phase.projet IN (SELECT p FROM Projet p WHERE :userId IN (SELECT e.id FROM p.entrepreneurs e) OR :userId IN (SELECT c.id FROM p.coaches c))")
    List<Task> findByTaskCategory_IdAndProjetEntrepreneursOrCoaches(Long categoryId, Long userId);
}