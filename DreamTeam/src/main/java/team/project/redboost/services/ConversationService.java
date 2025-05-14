package team.project.redboost.services;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Conversation;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.ConversationRepository;
import team.project.redboost.repositories.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Conversation createPrivateConversation(Long user1Id, Long user2Id) {
        if (user1Id.equals(user2Id)) {
            throw new IllegalArgumentException("Cannot create a conversation with the same user");
        }
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + user1Id));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + user2Id));
        return conversationRepository.findPrivateConversation(user1.getId(), user2.getId())
                .orElseGet(() -> {
                    Conversation conv = new Conversation();
                    conv.setEstGroupe(false);
                    conv.setTitre(generatePrivateConversationName(user1, user2));
                    conv.setCreator(user1);
                    conv.getParticipants().add(user1);
                    conv.getParticipants().add(user2);
                    return conversationRepository.save(conv);
                });
    }

    @Transactional
    public Conversation createGroupConversation(String groupName, Long creatorId, List<Long> memberIds) {
        if (groupName == null || groupName.trim().isEmpty()) {
            throw new IllegalArgumentException("Group name cannot be empty");
        }
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + creatorId));
        Conversation conv = new Conversation();
        conv.setEstGroupe(true);
        conv.setTitre(groupName);
        conv.setCreator(creator);
        conv.getParticipants().add(creator);
        memberIds.forEach(memberId -> {
            if (!memberId.equals(creatorId)) {
                User member = userRepository.findById(memberId)
                        .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + memberId));
                conv.getParticipants().add(member);
            }
        });
        return conversationRepository.save(conv);
    }

    @Transactional(readOnly = true)
    public Conversation getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        return conversation;
    }

    @Transactional
    public void deleteConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        if (conversation.isEstGroupe() && !conversation.getCreator().getId().equals(userId)) {
            throw new SecurityException("Only the creator can delete the group conversation");
        }
        if (!conversation.isEstGroupe() && !conversation.getParticipants().stream()
                .anyMatch(u -> u.getId().equals(userId))) {
            throw new SecurityException("User is not a participant of this conversation");
        }
        conversation.setDeleted(true);
        conversationRepository.save(conversation);
    }

    @Transactional
    public Conversation addMemberToConversation(Long conversationId, Long currentUserId, Long memberId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        if (!conversation.isEstGroupe()) {
            throw new IllegalArgumentException("Cannot add members to a private conversation");
        }
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(currentUserId));
        if (!isParticipant) {
            throw new SecurityException("User is not authorized to modify this conversation");
        }
        User newMember = userRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + memberId));
        if (conversation.getParticipants().contains(newMember)) {
            throw new IllegalArgumentException("User is already a member of this conversation");
        }
        conversation.getParticipants().add(newMember);
        return conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    public List<User> getGroupMembers(Long conversationId, Long currentUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        if (!conversation.isEstGroupe()) {
            throw new IllegalArgumentException("This functionality is only for group conversations");
        }
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(currentUserId));
        if (!isParticipant) {
            throw new SecurityException("User is not authorized to view members of this conversation");
        }
        return new ArrayList<>(conversation.getParticipants());
    }

    @Transactional(readOnly = true)
    public List<User> getNonMembers(Long conversationId, Long currentUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        if (!conversation.isEstGroupe()) {
            throw new IllegalArgumentException("This functionality is only for group conversations");
        }
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(user -> user.getId().equals(currentUserId));
        if (!isParticipant) {
            throw new SecurityException("User is not authorized to view non-members of this conversation");
        }
        List<User> allUsers = userRepository.findAll();
        Set<Long> participantIds = conversation.getParticipants().stream()
                .map(User::getId)
                .collect(Collectors.toSet());
        return allUsers.stream()
                .filter(user -> !participantIds.contains(user.getId()))
                .filter(user -> !user.getId().equals(currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public void leaveGroupConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found with ID: " + conversationId));
        if (!conversation.isEstGroupe()) {
            throw new IllegalArgumentException("Cannot leave a non-group conversation");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        if (conversation.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("Group creator cannot leave the group");
        }
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(participant -> participant.getId().equals(userId));
        if (!isParticipant) {
            throw new SecurityException("User is not a member of this group");
        }
        conversation.getParticipants().removeIf(participant -> participant.getId().equals(userId));
        conversationRepository.save(conversation);
    }

    private String generatePrivateConversationName(User user1, User user2) {
        return String.format("%s & %s", user1.getFirstName(), user2.getFirstName());
    }
}