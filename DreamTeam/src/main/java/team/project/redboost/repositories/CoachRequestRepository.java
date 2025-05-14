package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.CoachRequest;
import team.project.redboost.entities.RequestStatus;

import java.util.Optional;

public interface CoachRequestRepository extends JpaRepository<CoachRequest, Long> {
    boolean existsByEmailAndStatus(String email, RequestStatus status);
    Optional<CoachRequest> findByBinomeInvitationToken(String token);
}