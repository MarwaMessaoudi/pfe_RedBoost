// src/main/java/team/project/redboost/repositories/StartupMetricsRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.StartupMetrics;
import team.project.redboost.entities.Projet;
import java.util.List;

public interface StartupMetricsRepository extends JpaRepository<StartupMetrics, Long> {
    List<StartupMetrics> findByStartupIn(List<Projet> startups);
}