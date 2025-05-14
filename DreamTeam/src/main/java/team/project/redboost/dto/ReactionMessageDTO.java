package team.project.redboost.dto;

import lombok.Data;
import lombok.Builder;
@Builder
@Data
public class ReactionMessageDTO {
    private Long id;
    private Long userId;
    private String username;
    private String emoji;

    // Getters, setters via Lombok
}