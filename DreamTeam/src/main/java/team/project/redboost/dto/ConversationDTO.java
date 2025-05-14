package team.project.redboost.dto;

import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class ConversationDTO {

    private Long id;
    private String titre;
    private boolean estGroupe;
    private Long creatorId;
    private Set<Long> participantIds;
    private List<UserDetails> members;

    @Data
    public static class UserDetails {
        private Long id;
        private String firstName;
        private String lastName;
        private String role;
        private String profilePictureUrl; // New field

        public String getProfilePictureUrl() {
            return profilePictureUrl;
        }

        public void setProfilePictureUrl(String profilePictureUrl) {
            this.profilePictureUrl = profilePictureUrl;
        }

    }

    @Data
    public static class NonMemberUser {
        private Long id;
        private String firstName;
        private String lastName;
        private String role;
    }

    @Data
    public static class CreatePrivateConversationRequest {
        private Long recipientId;
    }

    @Data
    public static class CreateGroupRequest {
        private String name;
        private List<Long> memberIds;
    }



    @Data
    public static class AddMemberRequest {
        private Long memberId;
    }
}