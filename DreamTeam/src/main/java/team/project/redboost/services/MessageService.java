package team.project.redboost.services;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.config.EncryptionUtil;
import team.project.redboost.dto.MessageDTO;
import team.project.redboost.dto.NotificationDTO;
import team.project.redboost.dto.ReactionMessageDTO;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final ReactionMessageRepository reactionMessageRepository;
    private final MessageReadStatusRepository messageReadStatusRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${encryption.secret.key}")
    private String secretKey;

    private static final List<String> VALID_EMOJIS = List.of("👍", "❤️", "😂", "😮", "😢", "😡");

    @Transactional
    public Message sendPrivateMessage(Long senderId, Long recipientId, String content) {
        if (senderId.equals(recipientId)) {
            throw new IllegalArgumentException("Cannot send a message to oneself");
        }
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + senderId));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + recipientId));
        Conversation conversation = conversationRepository.findPrivateConversation(senderId, recipientId)
                .orElseGet(() -> {
                    Conversation newConversation = new Conversation();
                    newConversation.setEstGroupe(false);
                    newConversation.setCreator(sender);
                    newConversation.getParticipants().add(sender);
                    newConversation.getParticipants().add(recipient);
                    return conversationRepository.save(newConversation);
                });
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(senderId));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        Message message = new Message();
        String encryptedContent = EncryptionUtil.encrypt(content, secretKey);
        message.setContent(encryptedContent);
        message.setSenderId(senderId);
        message.setConversation(conversation);
        message.setDeleted(false);
        message.setDateEnvoi(LocalDateTime.now());
        Message savedMessage = messageRepository.save(message);
        conversation.getParticipants().forEach(user -> {
            MessageReadStatus readStatus = new MessageReadStatus();
            readStatus.setMessageId(savedMessage.getId());
            readStatus.setUserId(user.getId());
            readStatus.setRead(user.getId().equals(senderId));
            messageReadStatusRepository.save(readStatus);
        });
        MessageDTO messageDTO = convertToDTO(savedMessage, recipientId);
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversation.getId(),
                messageDTO
        );
        NotificationDTO notification = NotificationDTO.builder()
                .messageId(savedMessage.getId())
                .conversationId(conversation.getId())
                .senderId(senderId)
                .senderName(sender.getUsername())
                .contentPreview(content.length() > 50 ? content.substring(0, 47) + "..." : content)
                .timestamp(savedMessage.getDateEnvoi().toString())
                .build();
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + recipientId,
                notification
        );
        return savedMessage;
    }

    @Transactional
    public Message sendGroupMessage(Long senderId, Long conversationId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + senderId));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        if (conversation.isDeleted()) {
            throw new IllegalArgumentException("Cannot send message to a deleted conversation");
        }
        if (!conversation.isEstGroupe()) {
            throw new IllegalArgumentException("Provided ID does not correspond to a group conversation");
        }
        boolean isMember = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(senderId));
        if (!isMember) {
            throw new SecurityException("User is not a member of this conversation");
        }
        Message message = new Message();
        String encryptedContent = EncryptionUtil.encrypt(content, secretKey);
        message.setContent(encryptedContent);
        message.setSenderId(senderId);
        message.setConversation(conversation);
        message.setDeleted(false);
        message.setDateEnvoi(LocalDateTime.now());
        Message savedMessage = messageRepository.save(message);
        conversation.getParticipants().forEach(user -> {
            MessageReadStatus readStatus = new MessageReadStatus();
            readStatus.setMessageId(savedMessage.getId());
            readStatus.setUserId(user.getId());
            readStatus.setRead(user.getId().equals(senderId));
            messageReadStatusRepository.save(readStatus);
        });
        MessageDTO messageDTO = convertToDTO(savedMessage, senderId);
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId,
                messageDTO
        );
        conversation.getParticipants().stream()
                .filter(user -> !user.getId().equals(senderId))
                .forEach(user -> {
                    NotificationDTO notification = NotificationDTO.builder()
                            .messageId(savedMessage.getId())
                            .conversationId(conversationId)
                            .senderId(senderId)
                            .senderName(sender.getUsername())
                            .contentPreview(content.length() > 50 ? content.substring(0, 47) + "..." : content)
                            .timestamp(savedMessage.getDateEnvoi().toString())
                            .build();
                    messagingTemplate.convertAndSend(
                            "/topic/notifications/" + user.getId(),
                            notification
                    );
                });
        return savedMessage;
    }

    @Transactional
    public MessageDTO addReaction(Long messageId, Long userId, String emoji) {
        Message message = messageRepository.findByIdWithReactionMessages(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with ID: " + messageId));
        Conversation conversation = message.getConversation();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        if (message.isDeleted()) {
            throw new IllegalArgumentException("Cannot add reaction to a deleted message");
        }
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not authorized to react to this message");
        }
        if (emoji == null || emoji.trim().isEmpty()) {
            throw new IllegalArgumentException("Emoji cannot be empty");
        }
        if (!VALID_EMOJIS.contains(emoji)) {
            throw new IllegalArgumentException("Invalid emoji");
        }
        Optional<ReactionMessage> existingReaction = reactionMessageRepository.findByMessageIdAndUserId(messageId, userId);
        if (existingReaction.isPresent()) {
            ReactionMessage reaction = existingReaction.get();
            reaction.setEmoji(emoji);
            reactionMessageRepository.save(reaction);
        } else {
            ReactionMessage reaction = new ReactionMessage();
            reaction.setMessage(message);
            reaction.setUserId(userId);
            reaction.setEmoji(emoji);
            reactionMessageRepository.save(reaction);
        }
        MessageDTO updatedMessage = convertToDTO(message, userId);
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversation.getId(),
                updatedMessage
        );
        return updatedMessage;
    }

    @Transactional
    public MessageDTO removeReaction(Long messageId, Long userId) {
        Message message = messageRepository.findByIdWithReactionMessages(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with ID: " + messageId));
        Conversation conversation = message.getConversation();
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not authorized to remove reaction from this message");
        }
        if (message.isDeleted()) {
            throw new IllegalArgumentException("Cannot remove reaction from a deleted message");
        }
        reactionMessageRepository.deleteByMessageIdAndUserId(messageId, userId);
        MessageDTO updatedMessage = convertToDTO(message, userId);
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversation.getId(),
                updatedMessage
        );
        return updatedMessage;
    }

    @Transactional(readOnly = true)
    public List<Message> getPrivateConversation(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + user1Id));
        Conversation conversation = conversationRepository.findPrivateConversation(user1Id, user2Id)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(user1Id));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        return messageRepository.findNonDeletedByConversationId(conversation.getId(), Sort.by("dateEnvoi").ascending());
    }

    @Transactional(readOnly = true)
    public List<Message> getGroupConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        return getAllMessagesByConversationId(conversationId);
    }

    @Transactional
    public void markMessagesAsRead(List<Long> messageIds, Long userId) {
        if (messageIds.isEmpty()) {
            return;
        }
        Message firstMessage = messageRepository.findById(messageIds.get(0))
                .orElseThrow(() -> new EntityNotFoundException("Message not found with ID: " + messageIds.get(0)));
        Conversation conversation = firstMessage.getConversation();
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        messageIds.forEach(messageId -> {
            Optional<MessageReadStatus> readStatusOpt = messageReadStatusRepository.findByMessageIdAndUserId(messageId, userId);
            MessageReadStatus readStatus;
            if (readStatusOpt.isPresent()) {
                readStatus = readStatusOpt.get();
                readStatus.setRead(true);
            } else {
                readStatus = new MessageReadStatus();
                readStatus.setMessageId(messageId);
                readStatus.setUserId(userId);
                readStatus.setRead(true);
            }
            messageReadStatusRepository.save(readStatus);
            messageRepository.findById(messageId).ifPresent(message -> {
                MessageDTO updatedMessage = convertToDTO(message, userId);
                messagingTemplate.convertAndSend(
                        "/topic/conversation/" + conversation.getId(),
                        updatedMessage
                );
            });
        });
    }

    @Transactional(readOnly = true)
    public List<Message> getUnreadMessages(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        return messageRepository.findUnreadNonDeletedMessages(userId);
    }

    @Transactional
    public Message updateMessage(Long messageId, Long userId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with ID: " + messageId));
        if (message.isDeleted()) {
            throw new IllegalArgumentException("Cannot update deleted message");
        }
        if (!message.getSenderId().equals(userId)) {
            throw new SecurityException("User is not authorized to update this message");
        }
        String encryptedContent = EncryptionUtil.encrypt(newContent, secretKey);
        message.setContent(encryptedContent);
        Message updatedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + message.getConversation().getId(),
                convertToDTO(updatedMessage, userId)
        );
        return updatedMessage;
    }

    @Transactional
    public Message deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with ID: " + messageId));
        if (!message.getSenderId().equals(userId)) {
            throw new SecurityException("User is not authorized to delete this message");
        }
        message.setContent("Message retiré");
        Message updatedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + message.getConversation().getId(),
                convertToDTO(updatedMessage, userId)
        );
        return updatedMessage;
    }

    @Transactional(readOnly = true)
    public Optional<Message> getMessageById(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with ID: " + messageId));
        boolean isParticipant = message.getConversation().getParticipants().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not authorized to access this message");
        }
        return Optional.of(message).filter(m -> !m.isDeleted());
    }

    @Transactional(readOnly = true)
    public List<Message> getAllMessagesByConversationId(Long conversationId) {
        return messageRepository.findNonDeletedByConversationId(conversationId, Sort.by("dateEnvoi").ascending());
    }

    @Transactional(readOnly = true)
    public List<Message> getAllMessagesByConversationId(Long conversationId, Long userId, Pageable pageable) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        return messageRepository.findNonDeletedByConversationId(conversationId, pageable);
    }

    @Transactional(readOnly = true)
    public List<Message> getAllMessagesByConversationId(Long conversationId, Sort sort) {
        return messageRepository.findNonDeletedByConversationId(conversationId, sort);
    }

    @Deprecated
    public List<Message> getAllMessages() {
        return messageRepository.findAllNonDeleted();
    }

    @Deprecated
    public List<Message> getAllMessages(Pageable pageable) {
        return messageRepository.findAllNonDeleted(pageable);
    }

    @Transactional(readOnly = true)
    public Long getUnreadMessageCount(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        return messageRepository.countUnreadMessagesByConversationIdAndUserId(conversationId, userId);
    }

    @Transactional(readOnly = true)
    public Long getTotalUnreadMessageCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        return messageRepository.countAllUnreadMessagesByUserId(userId);
    }

    public MessageDTO convertToDTO(Message message, Long viewerId) {
        User sender = userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new EntityNotFoundException("Sender not found with ID: " + message.getSenderId()));
        boolean isRead = messageReadStatusRepository.findByMessageIdAndUserId(message.getId(), viewerId)
                .map(MessageReadStatus::isRead)
                .orElse(false);
        String decryptedContent = message.getContent().equals("Message retiré")
                ? message.getContent()
                : EncryptionUtil.decrypt(message.getContent(), secretKey);
        MessageDTO.MessageDTOBuilder builder = MessageDTO.builder()
                .id(message.getId())
                .content(decryptedContent)
                .timestamp(message.getDateEnvoi())
                .isRead(isRead)
                .senderId(message.getSenderId())
                .senderName(sender.getUsername())
                .senderAvatar(sender.getProfilePictureUrl())
                .conversationId(message.getConversation().getId())
                .dateEnvoi(message.getDateEnvoi())
                .reactionMessages(message.getReactionMessages().stream()
                        .map(r -> {
                            User reactionUser = userRepository.findById(r.getUserId())
                                    .orElseThrow(() -> new EntityNotFoundException("Reaction user not found with ID: " + r.getUserId()));
                            return ReactionMessageDTO.builder()
                                    .id(r.getId())
                                    .userId(r.getUserId())
                                    .username(reactionUser.getUsername())
                                    .emoji(r.getEmoji())
                                    .build();
                        })
                        .collect(Collectors.toList()));
        if (message.getConversation().isEstGroupe()) {
            builder.groupId(message.getConversation().getId());
        }
        return builder.build();
    }
}