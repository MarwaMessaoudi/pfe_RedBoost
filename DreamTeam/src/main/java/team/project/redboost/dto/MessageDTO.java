package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class MessageDTO {
    private Long id;
    private String content;
    private LocalDateTime timestamp;
    private boolean isRead;
    private String senderAvatar;
    private Long senderId;
    private String senderName;
    private Long groupId;
    private String groupName;
    private Long conversationId;
    private List<ReactionMessageDTO> reactionMessages;

    @Builder.Default
    private LocalDateTime dateEnvoi = LocalDateTime.now();
}