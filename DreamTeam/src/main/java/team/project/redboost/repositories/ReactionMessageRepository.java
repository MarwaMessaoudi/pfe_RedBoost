package team.project.redboost.repositories;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ReactionMessage;

import java.util.Optional;

@Repository
public interface ReactionMessageRepository extends JpaRepository<ReactionMessage, Long> {
    Optional<ReactionMessage> findByMessageIdAndUserId(Long messageId, Long userId);
    void deleteByMessageIdAndUserId(Long messageId, Long userId);
}