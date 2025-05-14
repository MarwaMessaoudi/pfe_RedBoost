package team.project.redboost.repositories;


import team.project.redboost.entities.Service;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceAdminRepository extends JpaRepository<Service, Long> {
}
