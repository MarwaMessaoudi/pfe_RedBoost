package team.project.redboost.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.Message;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages " +
            "WHERE m.conversation.id IN (" +
            "SELECT c.id FROM Conversation c WHERE " +
            "c.estGroupe = false AND " +
            ":user1Id IN (SELECT p.id FROM c.participants p) AND " +
            ":user2Id IN (SELECT p.id FROM c.participants p) AND " +
            "SIZE(c.participants) = 2) " +
            "ORDER BY m.dateEnvoi ASC")
    List<Message> findPrivateMessages(@Param("user1Id") Long user1Id,
                                      @Param("user2Id") Long user2Id);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages " +
            "WHERE m.conversation.id IN (" +
            "SELECT c.id FROM Conversation c WHERE " +
            "c.estGroupe = false AND " +
            ":user1Id IN (SELECT p.id FROM c.participants p) AND " +
            ":user2Id IN (SELECT p.id FROM c.participants p) AND " +
            "SIZE(c.participants) = 2) " +
            "AND m.deleted = false " +
            "ORDER BY m.dateEnvoi ASC")
    List<Message> findNonDeletedPrivateMessages(@Param("user1Id") Long user1Id,
                                                @Param("user2Id") Long user2Id);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages WHERE " +
            "m.conversation.id = :conversationId " +
            "ORDER BY m.dateEnvoi ASC")
    List<Message> findByConversationId(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages WHERE " +
            "m.conversation.id = :conversationId " +
            "AND m.deleted = false " +
            "ORDER BY m.dateEnvoi ASC")
    List<Message> findNonDeletedByConversationId(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages WHERE " +
            "m.conversation.id = :conversationId " +
            "AND m.deleted = false")
    List<Message> findNonDeletedByConversationId(@Param("conversationId") Long conversationId,
                                                 Pageable pageable);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages WHERE " +
            "m.conversation.id = :conversationId AND m.deleted = false")
    List<Message> findNonDeletedByConversationId(@Param("conversationId") Long conversationId, Sort sort);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages " +
            "WHERE m.conversation.id IN (" +
            "SELECT c.id FROM Conversation c WHERE :userId IN (SELECT p.id FROM c.participants p)) " +
            "AND NOT EXISTS (" +
            "SELECT 1 FROM MessageReadStatus mrs WHERE mrs.messageId = m.id AND mrs.userId = :userId AND mrs.isRead = true)")
    List<Message> findUnreadMessages(@Param("userId") Long userId);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages " +
            "WHERE m.conversation.id IN (" +
            "SELECT c.id FROM Conversation c WHERE :userId IN (SELECT p.id FROM c.participants p)) " +
            "AND NOT EXISTS (" +
            "SELECT 1 FROM MessageReadStatus mrs WHERE mrs.messageId = m.id AND mrs.userId = :userId AND mrs.isRead = true) " +
            "AND m.deleted = false")
    List<Message> findUnreadNonDeletedMessages(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.deleted = true WHERE m.id = :messageId " +
            "AND m.senderId = :userId")
    void softDeleteMessage(@Param("messageId") Long messageId,
                           @Param("userId") Long userId);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages WHERE m.deleted = false")
    List<Message> findAllNonDeleted();

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages WHERE m.deleted = false")
    List<Message> findAllNonDeleted(Pageable pageable);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.reactionMessages WHERE m.id = :messageId")
    Optional<Message> findByIdWithReactionMessages(@Param("messageId") Long messageId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId " +
            "AND :userId IN (SELECT p.id FROM m.conversation.participants p) " +
            "AND NOT EXISTS (" +
            "SELECT 1 FROM MessageReadStatus mrs WHERE mrs.messageId = m.id AND mrs.userId = :userId AND mrs.isRead = true) " +
            "AND m.deleted = false")
    Long countUnreadMessagesByConversationIdAndUserId(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m " +
            "WHERE m.conversation.id IN (" +
            "SELECT c.id FROM Conversation c WHERE :userId IN (SELECT p.id FROM c.participants p)) " +
            "AND NOT EXISTS (" +
            "SELECT 1 FROM MessageReadStatus mrs WHERE mrs.messageId = m.id AND mrs.userId = :userId AND mrs.isRead = true) " +
            "AND m.deleted = false")
    Long countAllUnreadMessagesByUserId(@Param("userId") Long userId);




}