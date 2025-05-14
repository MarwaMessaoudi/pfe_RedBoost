// team/project/redboost/dto/RevenueDataDTO.java
package team.project.redboost.dto;

import lombok.Data;

@Data
public class RevenueDataDTO {
    private String month;
    private double revenue;

    public RevenueDataDTO(String month, double revenue) {
        this.month = month;
        this.revenue = revenue;
    }
}