package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.Phase;
import team.project.redboost.entities.Phase.Status;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;


public interface PhaseRepository extends JpaRepository<Phase, Long> {

    List<Phase> findByStartDateBetween(LocalDate start, LocalDate end);

    @Query(value = """
    SELECT pe.projet_id, 
           GROUP_CONCAT(
               CONCAT(
                   u.id, '|', 
                   u.first_name, '|', 
                   u.last_name, '|', 
                   u.email, '|', 
                   u.phone_number, '|', 
                   u.role, '|', 
                   COALESCE(u.profile_picture_url, '')
               ) SEPARATOR '; '
           ) AS entrepreneurs_info
    FROM projet_entrepreneur pe
    JOIN user u ON pe.user_id = u.id
    WHERE pe.projet_id = :projetId
    GROUP BY pe.projet_id
""", nativeQuery = true)
    List<Map<String, Object>> findEntrepreneursByProject(@Param("projetId") Long projetId);

    @Query("SELECT ph FROM Phase ph JOIN FETCH ph.projet WHERE ph.phaseId = :phaseId")
    Optional<Phase> findByIdWithProjet(@Param("phaseId") Long phaseId);

    @Query("""
         SELECT ph FROM Phase ph
         JOIN ph.projet p
         JOIN p.entrepreneurs u
         WHERE u.id = :userId AND ph.status = :status
         """)
    List<Phase> findPhasesByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Status status);





    @Query("SELECT p FROM Phase p WHERE p.projet IN (SELECT pr FROM Projet pr WHERE :userId IN (SELECT e.id FROM pr.entrepreneurs e) OR :userId IN (SELECT c.id FROM pr.coaches c))")
    List<Phase> findByProjetEntrepreneursOrCoaches(Long userId);

    @Query("SELECT p FROM Phase p WHERE p.startDate BETWEEN :start AND :end AND p.projet IN (SELECT pr FROM Projet pr WHERE :userId IN (SELECT e.id FROM pr.entrepreneurs e) OR :userId IN (SELECT c.id FROM pr.coaches c))")
    List<Phase> findByStartDateBetweenAndProjetEntrepreneursOrCoaches(LocalDate start, LocalDate end, Long userId);
}



