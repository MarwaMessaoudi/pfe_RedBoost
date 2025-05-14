package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Entrepreneur;
import team.project.redboost.entities.RendezVous;
import team.project.redboost.entities.Coach;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    List<RendezVous> findByCoach(Coach coach); // Query by the Coach entity
    List<RendezVous> findByDateAndStatus(LocalDate date, RendezVous.Status status);
    List<RendezVous> findByCoachId(Long coachId);
    List<RendezVous> findByEntrepreneurId(Long entrepreneurId);
    List<RendezVous> findByEntrepreneur(Entrepreneur entrepreneur);

    @Query("SELECT r FROM RendezVous r WHERE r.coach.id = :userId OR r.entrepreneur.id = :userId")
    List<RendezVous> findByUserId(Long userId);

    @Query("SELECT COUNT(r) FROM RendezVous r WHERE r.coach.id = :userId OR r.entrepreneur.id = :userId")
    long countAllByUser(Long userId);

    @Query("SELECT COUNT(r) FROM RendezVous r WHERE (r.coach.id = :userId OR r.entrepreneur.id = :userId) AND r.status = 'ACCEPTED'")
    long countAcceptedByUser(Long userId);

    @Query("SELECT COUNT(r) FROM RendezVous r WHERE (r.coach.id = :userId OR r.entrepreneur.id = :userId) AND r.status = 'PENDING'")
    long countPendingByUser(Long userId);

    @Query("SELECT COUNT(r) FROM RendezVous r WHERE (r.coach.id = :userId OR r.entrepreneur.id = :userId) AND r.status = 'REJECTED'")
    long countRejectedByUser(Long userId);
}