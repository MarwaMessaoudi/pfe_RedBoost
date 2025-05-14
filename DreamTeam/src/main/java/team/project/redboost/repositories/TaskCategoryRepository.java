package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.TaskCategory;

public interface TaskCategoryRepository extends JpaRepository<TaskCategory, Long> {
    TaskCategory findByName(String name);
}
