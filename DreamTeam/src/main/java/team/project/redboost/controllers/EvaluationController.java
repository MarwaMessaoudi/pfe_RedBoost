package team.project.redboost.controllers;

// ... existing imports ...
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // Keep this import
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.EvaluationForm;
import team.project.redboost.entities.Phase;
import team.project.redboost.entities.User; // Import your User entity if needed
import team.project.redboost.repositories.EvaluationFormRepository; // Ensure path is correct
import team.project.redboost.repositories.PhaseRepository; // Ensure path is correct
import team.project.redboost.repositories.UserRepository; // Ensure path is correct
import team.project.redboost.entities.Phase.Status; // Import Phase Status

// IMPORTE Evaluation Service
import team.project.redboost.services.EvaluationService;

// Imports for getting authenticated user (if using Spring Security)
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;


import jakarta.validation.Valid; // or javax.validation.Valid
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.Optional; // Import Optional for getEvaluationFormById


@RestController
// **VERIFY THIS MAPPING** matches what your Angular service uses
@RequestMapping("/api/evaluations") // Used /api/evaluations previously as more standard
@CrossOrigin(origins = "http://localhost:4200") // Allow requests from Angular dev server
public class EvaluationController {

    // Repositories are still injected, potentially used for other endpoints,
    // but main business logic is in the service.
    private final EvaluationFormRepository evaluationFormRepository;
    private final UserRepository userRepository;
    private final PhaseRepository phaseRepository;
    // Inject the EvaluationService
    private final EvaluationService evaluationService;


    @Autowired
    public EvaluationController(
            EvaluationFormRepository evaluationFormRepository,
            UserRepository userRepository,
            PhaseRepository phaseRepository,
            EvaluationService evaluationService // Inject the service
    ) {
        this.evaluationFormRepository = evaluationFormRepository;
        this.userRepository = userRepository;
        this.phaseRepository = phaseRepository;
        this.evaluationService = evaluationService; // Assign the service
    }

    /**
     * Submits a new evaluation form.
     * Receives JSON data and delegates processing to the service layer.
     * Handles specific exceptions from the service to return appropriate HTTP responses.
     *
     * @param evaluationForm The submitted evaluation form data (as JSON).
     * @return ResponseEntity with the saved form or an error message.
     */
    @PostMapping
    public ResponseEntity<?> submitEvaluation(@Valid @RequestBody EvaluationForm evaluationForm) {
        // ** SECURITY WARNING **: In a real application, user authentication is CRITICAL.
        // Ensure the submitting user is identified securely on the backend.

        try {
            // Delegate the core logic to the service layer
            // The service should validate data, fetch entities, check for duplicates, and save.
            EvaluationForm savedForm = evaluationService.submitEvaluation(evaluationForm);

            // If service completes successfully, return 201 Created
            return ResponseEntity.status(HttpStatus.CREATED).body(savedForm);

        } catch (IllegalArgumentException e) {
            // Catch validation errors (e.g., User or Phase ID missing) explicitly
            System.err.println("Evaluation submission validation error: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage()); // Return 400 Bad Request

        } catch (IllegalStateException e) {
            // Catch duplicate submission error explicitly
            System.err.println("Duplicate evaluation submission detected: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage()); // Return 409 Conflict

        } catch (RuntimeException e) {
            // Catch other RuntimeExceptions (e.g., User or Phase not found from repo/service)
            System.err.println("Data fetching error during evaluation submission via service: " + e.getMessage());
            // Basic check to return 404 if "not found" is in the message, otherwise 500
            if (e.getMessage().contains("not found")) { // Better to use custom exceptions for this
                // *** FIX: Corrected typo HttpStatus.NOT_NOT_FOUND to HttpStatus.NOT_FOUND ***
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage()); // 404 Not Found
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during data processing on the server."); // Generic 500

        } catch (Exception e) {
            // Catch any other unexpected exceptions not specifically handled
            System.err.println("An unexpected error occurred during evaluation submission:");
            e.printStackTrace(); // Log the full stack trace on the server side
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected server error occurred during submission."); // Generic 500
        }
    }


    /**
     * Endpoint to check for completed phases that the given user (entrepreneur)
     * needs to evaluate. Delegates logic to the service layer.
     * **SECURITY WARNING:** This endpoint receives userId from the path. In a production
     * application, this MUST be secured (e.g., with Spring Security) to ensure the userId
     * in the path matches the ID of the authenticated user. Do NOT proceed without this crucial security measure.
     *
     * @param userId The ID of the user (should be verified via authentication).
     * @return A list of phase IDs requiring evaluation or an error response.
     */
    // **VERIFY THIS MAPPING** matches what your Angular service uses
    @GetMapping("/pending-for-user/{userId}")
    public ResponseEntity<List<Long>> getPendingEvaluationsForUser(@PathVariable Long userId) {
        // **SECURE:** In a production app, VERIFY the {userId} path variable
        // against the ID of the *currently authenticated user* using your security framework (e.g., Spring Security).
        // Attempting to fetch data for an arbitrary user ID from the path is a major security vulnerability.
        // Example using SecurityContextHolder (if applicable):
        // Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // Long authenticatedUserId = ... get user ID from authentication object ...; // Depending on UserDetails implementation
        // if (!userId.equals(authenticatedUserId)) {
        //    // Log forbidden attempt and return 403
        //    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null); // Or throw AccessDeniedException handled globally
        // }


        try {
            // Delegate the logic for finding pending evaluations to the service layer.
            // The service should handle user existence check and core evaluation logic.
            List<Long> pendingPhaseIds = evaluationService.getPendingEvaluationPhaseIds(userId);

            // The service returns an empty list if no pending evals are found or user doesn't exist/is invalid.
            // So we can simply return 200 OK with the list.
            return ResponseEntity.ok(pendingPhaseIds);

        } catch (Exception e) {
            // Catch any errors thrown by the service or occurring in the controller
            System.err.println("Error fetching pending evaluations via service in controller:");
            e.printStackTrace(); // Log full stack trace for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null); // Return 500 Internal Server Error
        }
    }

    // Optional: Add GET endpoint to fetch evaluation forms by ID (requires authorization)
    @GetMapping("/{evaluationId}")
    public ResponseEntity<EvaluationForm> getEvaluationFormById(@PathVariable Long evaluationId) {
        // Retrieve an evaluation by its ID
        Optional<EvaluationForm> evaluation = evaluationFormRepository.findById(evaluationId);

        if (evaluation.isPresent()) {
            // **SECURITY**: Add authorization checks here (e.g., can the requesting user view THIS specific evaluation?)
            return ResponseEntity.ok(evaluation.get()); // If found, return 200 OK
        } else {
            return ResponseEntity.notFound().build(); // If not found, return 404 Not Found
        }
    }


    // Optional: Get all forms (admin endpoint - requires strict authorization)
    // @GetMapping
    // public List<EvaluationForm> getAllEvaluationForms() {
    //     // **SECURITY**: Implement strict authorization check here (e.g., only ADMIN role allowed)
    //     return evaluationFormRepository.findAll(); // Retrieve all evaluation forms
    // }
}