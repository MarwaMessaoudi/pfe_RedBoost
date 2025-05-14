package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.EvaluationForm; // Ensure path is correct
import team.project.redboost.entities.Phase;          // Ensure path is correct
import team.project.redboost.entities.User;           // Ensure path is correct
import team.project.redboost.repositories.EvaluationFormRepository; // Ensure path is correct
import team.project.redboost.repositories.PhaseRepository; // Ensure path is correct
import team.project.redboost.repositories.UserRepository; // Ensure path is correct
import team.project.redboost.entities.Phase.Status;   // Import the Status enum


import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;


@Service
public class EvaluationService {

    private final EvaluationFormRepository evaluationFormRepository;
    private final UserRepository userRepository;
    private final PhaseRepository phaseRepository;

    @Autowired
    public EvaluationService(
            EvaluationFormRepository evaluationFormRepository,
            UserRepository userRepository,
            PhaseRepository phaseRepository) {
        this.evaluationFormRepository = evaluationFormRepository;
        this.userRepository = userRepository;
        this.phaseRepository = phaseRepository;
    }

    /**
     * Submits and saves a new evaluation form.
     * Expects a partially populated EvaluationForm object from the controller,
     * including user and phase references (likely just with IDs).
     * Fetches full User and Phase entities before saving.
     *
     * @param evaluationForm The evaluation form data received.
     * @return The saved EvaluationForm entity.
     * @throws IllegalArgumentException if User or Phase ID is missing.
     * @throws RuntimeException if User or Phase is not found (consider custom exceptions).
     * @throws IllegalStateException if an evaluation already exists for this user/phase.
     */
    @Transactional // Ensure the operation is atomic
    public EvaluationForm submitEvaluation(EvaluationForm evaluationForm) {
        // In a secure application, verify the User ID against the authenticated principal
        // from Spring Security context here or in the controller before calling this service.
        // Assuming evaluationForm.getUser().getId() comes from a verified source or is trustable *for this demo*.

        // --- Validation & Fetching Relationships ---
        if (evaluationForm.getUser() == null || evaluationForm.getUser().getId() == null) {
            throw new IllegalArgumentException("User ID is mandatory for evaluation submission.");
        }
        // Assuming getPhaseId() returns the ID, not getPhase().getPhaseId() based on how frontend sends.
        // If frontend sends { phase: { phaseId: X } }, then evaluationForm.getPhase() would return the nested Phase object
        // which might only have the ID set. Need to adjust logic slightly based on payload structure.
        // Let's stick to evaluationForm.getPhase().getPhaseId() as modeled in EvaluationForm entity with ManyToOne phase field.
        if (evaluationForm.getPhase() == null || evaluationForm.getPhase().getPhaseId() == null) {
            throw new IllegalArgumentException("Phase ID is mandatory for evaluation submission.");
        }

        // Fetch the User entity to establish the relationship
        User user = userRepository.findById(evaluationForm.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + evaluationForm.getUser().getId())); // Or a specific NotFoundException

        // Fetch the Phase entity to establish the relationship
        Phase phase = phaseRepository.findById(evaluationForm.getPhase().getPhaseId())
                .orElseThrow(() -> new RuntimeException("Phase not found with ID: " + evaluationForm.getPhase().getPhaseId())); // Or a specific NotFoundException


        // --- Business Logic Validation (e.g., Prevent Duplicates) ---
        // FIX: Use the corrected method name from EvaluationFormRepository
        boolean alreadySubmitted = evaluationFormRepository.existsByUserIdAndPhase_PhaseId(user.getId(), phase.getPhaseId()); // *** CORRECTED METHOD CALL ***
        if (alreadySubmitted) {
            // Throw a specific exception indicating conflict
            throw new IllegalStateException("Evaluation already submitted for phase " + phase.getPhaseId() + " by user " + user.getId()); // Or custom DuplicateEvaluationException
        }

        // --- Set Relationships and Save ---
        evaluationForm.setUser(user); // Link the fetched User entity
        evaluationForm.setPhase(phase); // Link the fetched Phase entity

        // Ensure required fields have default values or are handled if missing (should be covered by @Valid mostly)
        // Consider explicitly setting things like submittedAt if not using @PrePersist in entity
        // evaluationForm.setSubmittedAt(LocalDateTime.now()); // If using @PrePersist in entity, not needed here

        return evaluationFormRepository.save(evaluationForm); // Save the complete evaluation form
    }

    /**
     * Finds the IDs of completed phases for which the given user (entrepreneur)
     * is associated with via their projects AND has NOT yet submitted an evaluation form.
     * This endpoint helps the frontend determine when to prompt for evaluation.
     *
     * @param userId The ID of the entrepreneur user to check for pending evaluations.
     *              (In a production app, this should be obtained securely from the auth context).
     * @return A list of Phase IDs requiring evaluation by this user. Returns an empty list if none are pending.
     */
    public List<Long> getPendingEvaluationPhaseIds(Long userId) {
        // **Security Check Placeholders:**
        // 1. VERIFY the userId parameter matches the currently authenticated user ID if security is enabled.
        // 2. Optionally check if the user has the 'ENTREPRENEUR' role.

        // First, verify that the user exists.
        // In a secured application, this might be implicit if fetching the user from context,
        // but explicitly checking ID existence can be useful depending on setup.
        boolean userExists = userRepository.existsById(userId);
        if (!userExists) {
            // If the user ID itself is invalid, it might be better to log and
            // return an empty list or throw a specific security/not-found exception.
            // Returning empty list avoids exposing whether a user exists.
            System.err.println("Warning: getPendingEvaluationPhaseIds called for non-existent user ID: " + userId);
            return List.of(); // Return empty list
        }


        // Step 1: Find all phases marked as COMPLETED that this user is associated with through projects.
        // This relies on the custom query 'findPhasesByUserIdAndStatus' in PhaseRepository.
        List<Phase> completedPhasesForUserProjects = phaseRepository.findPhasesByUserIdAndStatus(userId, Status.COMPLETED);


        // Step 2: Find all evaluation forms already submitted by this user.
        // Use findByUserId which works as long as the User entity has an 'id' property
        List<EvaluationForm> submittedFormsByUser = evaluationFormRepository.findByUserId(userId);


        // Step 3: Extract the IDs of the phases for which the user has already submitted a form.
        // Collect these IDs into a Set for efficient O(1) lookup.
        Set<Long> evaluatedPhaseIds = submittedFormsByUser.stream()
                .map(evaluationForm -> evaluationForm.getPhase().getPhaseId()) // Get the phaseId from the linked Phase entity
                .collect(Collectors.toSet());


        // Step 4: Filter the list of completed phases, keeping only those whose IDs
        // are NOT present in the set of already evaluated phase IDs.
        // Ensure getPhaseId() doesn't return null before adding to the list
        List<Long> pendingPhaseIds = completedPhasesForUserProjects.stream()
                .filter(phase -> phase.getPhaseId() != null && !evaluatedPhaseIds.contains(phase.getPhaseId()))
                .map(phase -> phase.getPhaseId()) // Get the ID for the final list
                .collect(Collectors.toList());

        return pendingPhaseIds; // Return the list of phase IDs that still need evaluation
    }

    // Optional: Add methods to fetch evaluations for a specific phase or project for reporting/admin
    // public List<EvaluationForm> getEvaluationsForPhase(Long phaseId) { ... }
    // public List<EvaluationForm> getEvaluationsForProject(Long projetId) { ... } // Needs a custom query in repo

}