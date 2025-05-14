package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "kpis")
public class Kpi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String value;
    private String description;
    private int progress;

    @ManyToOne
    @JoinColumn(name = "coach_id")
    private Coach coach;
}