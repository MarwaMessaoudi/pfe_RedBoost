package team.project.redboost.dto;

import lombok.Data;
import team.project.redboost.entities.Comment;
import team.project.redboost.entities.User;

import java.time.LocalDateTime;

@Data
public class CommentDTO {
    private Long commentId;
    private String content;
    private Long userId;
    private String firstName;
    private String lastName;
    private String profilePictureUrl;
    private LocalDateTime createdAt;

    public CommentDTO(Comment comment, User user) {
        this.commentId = comment.getCommentId();
        this.content = comment.getContent();
        this.userId = comment.getUserId();
        this.firstName = user != null ? user.getFirstName() : "Unknown";
        this.lastName = user != null ? user.getLastName() : "User";
        this.profilePictureUrl = user != null && user.getProfilePictureUrl() != null
                ? user.getProfilePictureUrl()
                : "https://example.com/default-avatar.png";
        this.createdAt = comment.getCreatedAt();
    }
}