package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.Phase;
import team.project.redboost.services.PhaseService;
import team.project.redboost.services.UserService;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/phases")
@CrossOrigin(origins = "http://localhost:4200")
public class PhaseController {

    @Autowired
    private PhaseService phaseService;

    @Autowired
    private UserService userService;

    @PostMapping("/")
    public ResponseEntity<?> createPhase(@RequestBody Phase phase, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            phaseService.checkUserAuthorizationForProject(phase.getProjetId(), userEmail);
            Phase createdPhase = phaseService.createPhase(phase, userEmail); // Fixed: Added userEmail
            return ResponseEntity.ok(createdPhase);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to create a phase for project ID: " + phase.getProjetId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllPhases(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<Phase> phases = phaseService.getAllPhases(userEmail);
            return ResponseEntity.ok(phases);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access phases");
        }
    }

    @GetMapping("/{phaseId}")
    public ResponseEntity<?> getPhaseById(@PathVariable Long phaseId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Phase phase = phaseService.getPhaseById(phaseId, userEmail);
            return ResponseEntity.ok(phase);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Phase not found with ID: " + phaseId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access phase ID: " + phaseId);
        }
    }

    @PutMapping("/{phaseId}")
    public ResponseEntity<?> updatePhase(@PathVariable Long phaseId, @RequestBody Phase updatedPhase,
                                         Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Phase phase = phaseService.updatePhase(phaseId, updatedPhase, userEmail);
            return ResponseEntity.ok(phase);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Phase not found with ID: " + phaseId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to update phase ID: " + phaseId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{phaseId}")
    public ResponseEntity<?> deletePhase(@PathVariable Long phaseId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            phaseService.deletePhase(phaseId, userEmail);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Phase not found with ID: " + phaseId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to delete phase ID: " + phaseId);
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<?> getPhasesByDateRange(
            @RequestParam("start") String start,
            @RequestParam("end") String end,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(start, formatter);
            LocalDate endDate = LocalDate.parse(end, formatter);
            List<Phase> phases = phaseService.getPhasesByDateRange(startDate, endDate, userEmail);
            return ResponseEntity.ok(phases);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access phases");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid date format or parameters");
        }
    }

    @GetMapping("/entrepreneurs/{projetId}")
    public ResponseEntity<?> getEntrepreneursByProject(@PathVariable Long projetId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            phaseService.checkUserAuthorizationForProject(projetId, userEmail);
            List<Map<String, Object>> entrepreneurs = phaseService.getEntrepreneursByProject(projetId);
            return ResponseEntity.ok(entrepreneurs);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project not found with ID: " + projetId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access entrepreneurs for project ID: " + projetId);
        }
    }
}