package team.project.redboost.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@Table(name = "entrepreneur_details")
@PrimaryKeyJoinColumn(name = "user_id") // Maps to the primary key of the User table
@EqualsAndHashCode(callSuper = true)  // Ensures superclass is included
public class Entrepreneur extends User {

    @Size(min = 2, max = 100)
    private String startupName="Unknown";

    @Size(min = 2, max = 100)
    private String industry="Unknown";

    private Boolean validatedByAdmin = true; // Default value
}