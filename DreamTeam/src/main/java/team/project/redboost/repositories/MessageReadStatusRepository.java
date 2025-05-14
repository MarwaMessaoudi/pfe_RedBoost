package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.MessageReadStatus;

import java.util.Optional;

public interface MessageReadStatusRepository extends JpaRepository<MessageReadStatus, Long> {
    Optional<MessageReadStatus> findByMessageIdAndUserId(Long messageId, Long userId);

    @Query("SELECT COUNT(mrs) FROM MessageReadStatus mrs " +
            "JOIN Message m ON mrs.messageId = m.id " +
            "WHERE m.conversation.id = :conversationId " +
            "AND mrs.userId = :userId AND mrs.isRead = false")
    long countByMessageConversationIdAndUserIdAndIsReadFalse(@Param("conversationId") Long conversationId,
                                                             @Param("userId") Long userId);
}