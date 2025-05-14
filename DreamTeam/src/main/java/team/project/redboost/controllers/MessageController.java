package team.project.redboost.controllers;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.MessageDTO;
import team.project.redboost.dto.ReactionMessageDTO;
import team.project.redboost.entities.Message;
import team.project.redboost.entities.User;
import team.project.redboost.services.MessageService;
import team.project.redboost.services.UserService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;

    @PostMapping("/private")
    public ResponseEntity<?> sendPrivateMessage(
            @RequestBody PrivateMessageRequest request) {
        try {
            Message message = messageService.sendPrivateMessage(
                    request.getSenderId(),
                    request.getRecipientId(),
                    request.getContent()
            );
            return ResponseEntity.ok(messageService.convertToDTO(message, request.getRecipientId()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found: " + e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to send private message");
        }
    }

    @PostMapping("/group")
    public ResponseEntity<?> sendGroupMessage(
            @RequestBody GroupMessageRequest request) {
        try {
            Message message = messageService.sendGroupMessage(
                    request.getSenderId(),
                    request.getConversationId(),
                    request.getContent()
            );
            return ResponseEntity.ok(messageService.convertToDTO(message, request.getSenderId()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation or user not found: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to send message to conversation ID: " + request.getConversationId());
        }
    }

    @GetMapping("/private")
    public ResponseEntity<?> getPrivateConversation(
            @RequestParam Long user1Id,
            @RequestParam Long user2Id) {
        try {
            List<Message> messages = messageService.getPrivateConversation(user1Id, user2Id);
            return ResponseEntity.ok(messages.stream()
                    .map(message -> messageService.convertToDTO(message, user1Id))
                    .collect(Collectors.toList()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access private conversation");
        }
    }

    @GetMapping("/group/{conversationId}")
    public ResponseEntity<?> getGroupConversation(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        try {
            List<Message> messages = messageService.getGroupConversation(conversationId, userId);
            return ResponseEntity.ok(messages.stream()
                    .map(message -> messageService.convertToDTO(message, userId))
                    .collect(Collectors.toList()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found with ID: " + conversationId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access conversation ID: " + conversationId);
        }
    }

    @PutMapping("/mark-as-read")
    public ResponseEntity<?> markMessagesAsRead(
            @RequestBody List<Long> messageIds,
            @RequestParam Long userId) {
        try {
            messageService.markMessagesAsRead(messageIds, userId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Message or user not found");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to mark messages as read");
        }
    }

    @GetMapping("/unread/{userId}")
    public ResponseEntity<?> getUnreadMessages(
            @PathVariable Long userId) {
        try {
            List<Message> messages = messageService.getUnreadMessages(userId);
            return ResponseEntity.ok(messages.stream()
                    .map(message -> messageService.convertToDTO(message, userId))
                    .collect(Collectors.toList()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access unread messages for user ID: " + userId);
        }
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<?> updateMessage(
            @PathVariable Long messageId,
            @RequestBody UpdateMessageRequest request) {
        try {
            Message updatedMessage = messageService.updateMessage(
                    messageId,
                    request.getUserId(),
                    request.getNewContent()
            );
            return ResponseEntity.ok(messageService.convertToDTO(updatedMessage, request.getUserId()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Message not found with ID: " + messageId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to update message ID: " + messageId);
        }
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long messageId,
            @RequestParam Long userId) {
        try {
            Message updatedMessage = messageService.deleteMessage(messageId, userId);
            return ResponseEntity.ok(messageService.convertToDTO(updatedMessage, userId));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Message not found with ID: " + messageId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to delete message ID: " + messageId);
        }
    }

    @GetMapping("/{messageId}")
    public ResponseEntity<?> getMessageById(
            @PathVariable Long messageId,
            @RequestParam Long userId) {
        try {
            Message message = messageService.getMessageById(messageId, userId)
                    .orElseThrow(() -> new EntityNotFoundException("Message not found"));
            return ResponseEntity.ok(messageService.convertToDTO(message, userId));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Message not found with ID: " + messageId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access message ID: " + messageId);
        }
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<?> getConversationMessages(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("dateEnvoi").descending());
            List<Message> messages = messageService.getAllMessagesByConversationId(conversationId, userId, pageable);
            return ResponseEntity.ok(messages.stream()
                    .map(message -> messageService.convertToDTO(message, userId))
                    .collect(Collectors.toList()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found with ID: " + conversationId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access conversation ID: " + conversationId);
        }
    }

    @GetMapping("/unread/count/{conversationId}")
    public ResponseEntity<?> getUnreadMessageCount(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        try {
            Long count = messageService.getUnreadMessageCount(conversationId, userId);
            return ResponseEntity.ok(count);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found with ID: " + conversationId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access conversation ID: " + conversationId);
        }
    }

    @GetMapping("/unread/total-count/{userId}")
    public ResponseEntity<?> getTotalUnreadMessageCount(
            @PathVariable Long userId) {
        try {
            Long count = messageService.getTotalUnreadMessageCount(userId);
            return ResponseEntity.ok(count);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access unread message count for user ID: " + userId);
        }
    }

    @PostMapping("/{messageId}/reactions")
    public ResponseEntity<?> addReaction(
            @PathVariable Long messageId,
            @RequestParam Long userId,
            @RequestParam String emoji) {
        try {
            MessageDTO updatedMessage = messageService.addReaction(messageId, userId, emoji);
            return ResponseEntity.ok(updatedMessage);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Message or user not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to add reaction to message ID: " + messageId);
        }
    }

    @DeleteMapping("/{messageId}/reactions")
    public ResponseEntity<?> removeReaction(
            @PathVariable Long messageId,
            @RequestParam Long userId) {
        try {
            MessageDTO updatedMessage = messageService.removeReaction(messageId, userId);
            return ResponseEntity.ok(updatedMessage);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Message not found with ID: " + messageId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to remove reaction from message ID: " + messageId);
        }
    }

    private MessageDTO convertToDTO(Message message, Long viewerId) {
        User sender = userService.findById(message.getSenderId());
        MessageDTO.MessageDTOBuilder builder = MessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .timestamp(message.getDateEnvoi())
                .isRead(false) // Will be set by MessageService.convertToDTO
                .senderId(message.getSenderId())
                .senderName(sender.getUsername())
                .senderAvatar(sender.getProfilePictureUrl())
                .conversationId(message.getConversation().getId())
                .dateEnvoi(message.getDateEnvoi())
                .reactionMessages(message.getReactionMessages().stream()
                        .map(r -> {
                            User reactionUser = userService.findById(r.getUserId());
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

        return messageService.convertToDTO(message, viewerId); // Delegate to MessageService
    }

    @lombok.Data
    public static class PrivateMessageRequest {
        private Long senderId;
        private Long recipientId;
        private String content;
    }

    @lombok.Data
    public static class GroupMessageRequest {
        private Long senderId;
        private Long conversationId;
        private String content;
    }

    @lombok.Data
    public static class UpdateMessageRequest {
        private Long userId;
        private String newContent;
    }
}