package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.TaskActivity;

import java.util.List;

public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {
    List<TaskActivity> findByActivity_Id(Long activityId);
    List<TaskActivity> findByTaskCategoryActivity_Id(Long taskCategoryActivityId);
}