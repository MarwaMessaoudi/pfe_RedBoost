package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.GuideLanding;

import java.util.List;

public interface GuideLandingRepo extends JpaRepository<GuideLanding, Long> {
    List<GuideLanding> findByCategoryId(Long categoryId);
}
