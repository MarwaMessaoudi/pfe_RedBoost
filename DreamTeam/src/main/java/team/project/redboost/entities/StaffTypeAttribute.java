package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "staff_type_attributes")
@Data
public class StaffTypeAttribute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "staff_type_id")
    private StaffType staffType;

    @ManyToOne
    @JoinColumn(name = "attribute_id")
    private Attribute attribute;

    @Column(name = "is_default")
    private boolean isDefault;
}