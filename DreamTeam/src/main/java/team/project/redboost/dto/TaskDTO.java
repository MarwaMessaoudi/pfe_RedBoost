// team/project/redboost/dto/TaskDTO.java
package team.project.redboost.dto;

import lombok.Data;

@Data
public class TaskDTO {
    private String name;
    private String description;
    private int progress;
    private String color;
    private String gradient;
    private String status;

    public TaskDTO(String name, String description, int progress,
                   String color, String gradient, String status) {
        this.name = name;
        this.description = description;
        this.progress = progress;
        this.color = color;
        this.gradient = gradient;
        this.status = status;
    }
}