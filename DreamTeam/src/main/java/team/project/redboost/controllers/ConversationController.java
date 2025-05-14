package team.project.redboost.controllers;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.ConversationDTO;
import team.project.redboost.dto.ConversationDTO.UserDetails;
import team.project.redboost.dto.ConversationDTO.NonMemberUser;
import team.project.redboost.entities.Conversation;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.ConversationRepository;
import team.project.redboost.services.ConversationService;
import team.project.redboost.services.UserService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final UserService userService;
    private final ConversationRepository conversationRepository;

    @PostMapping("/private")
    public ResponseEntity<?> createPrivateConversation(
            @RequestBody ConversationDTO.CreatePrivateConversationRequest request,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            Conversation conversation = conversationService.createPrivateConversation(
                    currentUser.getId(),
                    request.getRecipientId()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(conversation, false));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to create a private conversation");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found: " + e.getMessage());
        }
    }

    @PostMapping("/group")
    public ResponseEntity<?> createGroupConversation(
            @RequestBody ConversationDTO.CreateGroupRequest request,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            Conversation conversation = conversationService.createGroupConversation(
                    request.getName(),
                    currentUser.getId(),
                    request.getMemberIds()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(conversation, false));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to create a group conversation");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserConversations(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            List<Conversation> conversations = conversationRepository.findAllUserConversations(currentUser);
            List<ConversationDTO> conversationDTOs = conversations.stream()
                    .map(conv -> convertToDTO(conv, false))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(conversationDTOs);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access conversations");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            Conversation conversation = conversationService.getConversation(id, currentUser.getId());
            return ResponseEntity.ok(convertToDTO(conversation, true));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found with ID: " + id);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access conversation ID: " + id);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            conversationService.deleteConversation(id, currentUser.getId());
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found with ID: " + id);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to delete conversation ID: " + id);
        }
    }

    @PatchMapping("/{id}/members")
    public ResponseEntity<?> addMemberToConversation(
            @PathVariable Long id,
            @RequestBody ConversationDTO.AddMemberRequest request,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            Conversation updatedConversation = conversationService.addMemberToConversation(
                    id,
                    currentUser.getId(),
                    request.getMemberId()
            );
            return ResponseEntity.ok(convertToDTO(updatedConversation, true));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation or user not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to add member to conversation ID: " + id);
        }
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<?> getGroupMembers(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            List<User> members = conversationService.getGroupMembers(id, currentUser.getId());
            List<UserDetails> memberDetails = members.stream()
                    .map(user -> {
                        UserDetails details = new UserDetails();
                        details.setId(user.getId());
                        details.setFirstName(user.getFirstName());
                        details.setLastName(user.getLastName());
                        details.setRole(user.getRole() != null ? user.getRole().toString() : "Utilisateur");
                        details.setProfilePictureUrl(user.getProfilePictureUrl());
                        return details;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(memberDetails);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found with ID: " + id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access members of conversation ID: " + id);
        }
    }

    @GetMapping("/{id}/non-members")
    public ResponseEntity<?> getNonMembers(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            List<User> nonMembers = conversationService.getNonMembers(id, currentUser.getId());
            List<NonMemberUser> nonMemberDetails = nonMembers.stream()
                    .map(user -> {
                        NonMemberUser details = new NonMemberUser();
                        details.setId(user.getId());
                        details.setFirstName(user.getFirstName());
                        details.setLastName(user.getLastName());
                        details.setRole(user.getRole() != null ? user.getRole().toString() : "Utilisateur");
                        return details;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(nonMemberDetails);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found with ID: " + id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access non-members of conversation ID: " + id);
        }
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leaveGroupConversation(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with email: " + userEmail);
            }
            conversationService.leaveGroupConversation(id, currentUser.getId());
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation or user not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to leave conversation ID: " + id);
        }
    }

    private ConversationDTO convertToDTO(Conversation conversation, boolean includeMembers) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setTitre(conversation.getTitre());
        dto.setEstGroupe(conversation.isEstGroupe());

        if (conversation.getCreator() != null) {
            dto.setCreatorId(conversation.getCreator().getId());
        }

        dto.setParticipantIds(conversation.getParticipants().stream()
                .map(User::getId)
                .collect(Collectors.toSet()));

        if (includeMembers && conversation.isEstGroupe()) {
            dto.setMembers(conversation.getParticipants().stream()
                    .map(user -> {
                        UserDetails details = new UserDetails();
                        details.setId(user.getId());
                        details.setFirstName(user.getFirstName());
                        details.setLastName(user.getLastName());
                        details.setRole(user.getRole() != null ? user.getRole().toString() : "Utilisateur");
                        return details;
                    })
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}