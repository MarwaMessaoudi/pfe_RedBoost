package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.Conversation;
import team.project.redboost.entities.User;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE " +
            "c.estGroupe = false AND " +
            ":user1 MEMBER OF c.participants AND " +
            ":user2 MEMBER OF c.participants AND " +
            "SIZE(c.participants) = 2")
    Optional<Conversation> findPrivateConversation(@Param("user1") User user1,
                                                   @Param("user2") User user2);

    @Query("SELECT c FROM Conversation c " +
            "JOIN c.participants p1 " +
            "JOIN c.participants p2 " +
            "WHERE c.estGroupe = false AND " +
            "p1.id = :user1Id AND p2.id = :user2Id AND " +
            "SIZE(c.participants) = 2")
    Optional<Conversation> findPrivateConversation(@Param("user1Id") Long user1Id,
                                                   @Param("user2Id") Long user2Id);

    @Query("SELECT c FROM Conversation c WHERE :user MEMBER OF c.participants " +
            "ORDER BY (SELECT MAX(m.dateEnvoi) FROM c.messages m) DESC")
    List<Conversation> findAllUserConversations(@Param("user") User user);

    @Query("SELECT c FROM Conversation c WHERE " +
            "c.estGroupe = true AND :user MEMBER OF c.participants")
    List<Conversation> findUserGroupConversations(@Param("user") User user);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM Conversation c WHERE c.id = :conversationId AND :user MEMBER OF c.participants")
    boolean isUserInConversation(@Param("user") User user,
                                 @Param("conversationId") Long conversationId);

    @Query("SELECT DISTINCT c FROM Conversation c " +
            "JOIN c.messages m " +
            "WHERE :userId IN (SELECT p.id FROM c.participants p) AND " +
            "EXISTS (SELECT 1 FROM MessageReadStatus mrs WHERE mrs.messageId = m.id AND mrs.userId = :userId AND mrs.isRead = false)")
    List<Conversation> findConversationsWithUnreadMessages(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE :user MEMBER OF c.participants AND c.isDeleted = false")
    List<Conversation> findAllActiveUserConversations(@Param("user") User user);

    @Query("SELECT c FROM Conversation c LEFT JOIN FETCH c.participants WHERE c.id = :conversationId")
    Optional<Conversation> findByIdWithParticipants(@Param("conversationId") Long conversationId);
}