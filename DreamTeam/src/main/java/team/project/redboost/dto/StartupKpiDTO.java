package team.project.redboost.dto;

import lombok.Data;

@Data
public class StartupKpiDTO {
    private String title;
    private String value;
    private String description;
    private int progress;

    public StartupKpiDTO(String title, String value, String description, int progress) {
        this.title = title;
        this.value = value;
        this.description = description;
        this.progress = progress;
    }
}