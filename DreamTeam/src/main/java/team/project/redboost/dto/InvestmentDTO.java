package team.project.redboost.dto;

import lombok.Data;
import team.project.redboost.entities.Projet;

import java.util.Date;

@Data
public class InvestmentDTO {
    private Long id;
    private Projet startup;
    private double amount;
    private double roi;
    private int progress;
    private Date lastUpdate;

    public InvestmentDTO(Long id, Projet startup, double amount, double roi, int progress, Date lastUpdate) {
        this.id = id;
        this.startup = startup;
        this.amount = amount;
        this.roi = roi;
        this.progress = progress;
        this.lastUpdate = lastUpdate;
    }
}