package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table
public class ServiceP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Double price;
    private String typeservice;

    @ElementCollection
    @CollectionTable(name = "service_subservices", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "sub_service")
    private List<String> subServices = new ArrayList<>();
}