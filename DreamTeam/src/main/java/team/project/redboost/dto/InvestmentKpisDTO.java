// team/project/redboost/dto/InvestmentKpisDTO.java
package team.project.redboost.dto;

import lombok.Data;

@Data
public class InvestmentKpisDTO {
    private double totalInvestments;
    private double averageRoi;
    private int activeInvestments;

    public InvestmentKpisDTO(double totalInvestments, double averageRoi, int activeInvestments) {
        this.totalInvestments = totalInvestments;
        this.averageRoi = averageRoi;
        this.activeInvestments = activeInvestments;
    }
}