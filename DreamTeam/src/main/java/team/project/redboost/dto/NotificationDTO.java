package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationDTO {
    private String type; // Add type to distinguish: "MESSAGE" or "INVITATION"
    private Long messageId;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String contentPreview; // Short preview of the message content
    private String timestamp;
    private Long projectId; // For invitations
    private String projectName; // For invitations
    private String invitorEmail; // For invitations
}