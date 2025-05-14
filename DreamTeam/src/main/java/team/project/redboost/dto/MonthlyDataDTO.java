// team/project/redboost/dto/MonthlyDataDTO.java
package team.project.redboost.dto;

import lombok.Data;

@Data
public class MonthlyDataDTO {
    private String month;
    private double roi;
    private double investments;

    public MonthlyDataDTO(String month, double roi, double investments) {
        this.month = month;
        this.roi = roi;
        this.investments = investments;
    }
}