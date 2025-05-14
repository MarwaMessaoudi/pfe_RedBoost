package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Activity;
import team.project.redboost.entities.Program;
import team.project.redboost.entities.TaskActivity;
import team.project.redboost.entities.Activity.ActivityStatus;
import team.project.redboost.repositories.ActivityRepository;
import team.project.redboost.repositories.ProgramRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ProgramRepository programRepository;

    public List<Activity> getActivitiesByProgram(Long programId) {
        return activityRepository.findByProgram_Id(programId);
    }

    public Activity createActivity(Activity activity, Long programId) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("Program not found"));

        activity.setProgram(program);
        return activityRepository.save(activity);
    }
    public Activity getActivityById(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activité introuvable avec ID: " + id));
    }

    public List<Activity> getActivitiesByProgramId(Long programId) {
        return activityRepository.findByProgram_Id(programId);
    }

    public Activity createActivityForProgram(Long programId, Activity activity) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("Programme introuvable avec ID: " + programId));

        activity.setProgram(program);

        // 🔥 Ajout important : si aucune tâche, statut initial = NOT_STARTED
        if (activity.getTaskActivities() == null || activity.getTaskActivities().isEmpty()) {
            activity.setStatus(Activity.ActivityStatus.NOT_STARTED);
        } else {
            activity.setStatus(determineStatusFromTasks(activity.getTaskActivities()));
        }

        return activityRepository.save(activity);
    }


    public Activity updateActivity(Long id, Activity updatedActivity) {
        Activity existing = getActivityById(id);

        existing.setName(updatedActivity.getName());
        existing.setDescription(updatedActivity.getDescription());
        existing.setStartDate(updatedActivity.getStartDate());
        existing.setEndDate(updatedActivity.getEndDate());
        existing.setColor(updatedActivity.getColor());

        // 🔥 Recalcul automatique
        existing.setStatus(determineStatusFromTasks(existing.getTaskActivities()));

        return activityRepository.save(existing);
    }


    private Activity.ActivityStatus determineStatusFromTasks(List<TaskActivity> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Activity.ActivityStatus.NOT_STARTED;
        }

        boolean allCompleted = tasks.stream()
                .allMatch(t -> t.getStatusActivity() == TaskActivity.StatusActivity.DONE);

        boolean someInProgress = tasks.stream()
                .anyMatch(t -> t.getStatusActivity() == TaskActivity. StatusActivity.IN_PROGRESS);

        if (allCompleted) {
            return Activity.ActivityStatus.COMPLETED;
        }
        if (someInProgress) {
            return Activity.ActivityStatus.IN_PROGRESS;
        }
        return Activity.ActivityStatus.NOT_STARTED;
    }




    public void deleteActivity(Long id) {
        activityRepository.deleteById(id);
    }

}