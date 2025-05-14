package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Kpi;
import team.project.redboost.entities.Coach;
import java.util.List;

public interface KPIRepository extends JpaRepository<Kpi, Long> {
    List<Kpi> findByCoach(Coach coach);
}