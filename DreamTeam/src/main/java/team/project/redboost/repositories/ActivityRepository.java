package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.Activity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    // Find activities by start date range
    List<Activity> findByStartDateBetween(LocalDate start, LocalDate end);
    // Added method to find activities by program ID
    List<Activity> findByProgram_Id(Long programId);
}