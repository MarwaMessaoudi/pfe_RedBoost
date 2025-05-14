package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.TaskCategoryActivity;

public interface TaskCategoryActivityRepository extends JpaRepository<TaskCategoryActivity, Long> {
    // Add custom query methods if needed
}