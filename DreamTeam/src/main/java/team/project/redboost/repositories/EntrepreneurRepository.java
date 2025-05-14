package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Entrepreneur;

import java.util.Optional;

public interface EntrepreneurRepository extends JpaRepository<Entrepreneur, Long> {
    Optional<Entrepreneur> findByEmail(String userEmail);
}
