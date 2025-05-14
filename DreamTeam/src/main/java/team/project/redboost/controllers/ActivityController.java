package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.Activity;
import team.project.redboost.services.ActivityService;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "http://localhost:4200") // adapte si nécessaire
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    // 🔍 Récupérer une activité par ID
    @GetMapping("/{id}")
    public ResponseEntity<Activity> getActivityById(@PathVariable Long id) {
        Activity activity = activityService.getActivityById(id);
        System.out.println("ACTIVITY FROM BACKEND: " + activity); // 👀
        return ResponseEntity.ok(activity);
    }

    // 📋 Liste des activités par programme
    @GetMapping("a/program/{programId}")
    public List<Activity> getActivitiesByProgram(@PathVariable Long programId) {
        return activityService.getActivitiesByProgramId(programId);
    }

    // ➕ Créer une activité pour un programme donné
    @PostMapping("/program/{programId}")
    public ResponseEntity<Activity> createActivity(@PathVariable Long programId, @RequestBody Activity activity) {
        Activity created = activityService.createActivityForProgram(programId, activity);
        return ResponseEntity.ok(created);
    }

    // ✏️ Mettre à jour une activité
    @PutMapping("/{id}")
    public ResponseEntity<Activity> updateActivity(@PathVariable Long id, @RequestBody Activity updatedActivity) {
        Activity activity = activityService.updateActivity(id, updatedActivity);
        return ResponseEntity.ok(activity);
    }

    // ❌ Supprimer une activité
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }
}
