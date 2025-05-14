package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "attributes")
@Data
public class Attribute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attribute_name")
    private String attributeName;

    @Column(name = "data_type")
    private String dataType;

    @ElementCollection
    @CollectionTable(name = "attribute_default_values", joinColumns = @JoinColumn(name = "attribute_id"))
    @Column(name = "default_value")
    private List<String> defaultValues; // Optional field, can be null
}