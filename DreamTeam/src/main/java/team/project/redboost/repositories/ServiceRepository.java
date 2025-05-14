package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ServiceP;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceP, Long> {
    // Custom query methods can be added here if needed
}
