package team.project.redboost.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.Coach;
import team.project.redboost.entities.Entrepreneur;
import team.project.redboost.entities.RendezVous;
import team.project.redboost.entities.RendezVousDTO;
import team.project.redboost.repositories.CoachRepository;
import team.project.redboost.repositories.EntrepreneurRepository;
import team.project.redboost.services.RendezVousService;
import team.project.redboost.services.GoogleCalendarService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rendezvous")
public class RendezVousController {

    @Autowired
    private GoogleCalendarService googleCalendarService;
    @Autowired
    private RendezVousService rendezVousService;

    private static final Logger logger = LoggerFactory.getLogger(RendezVousController.class);
    @Autowired
    private CoachRepository coachRepository;
    @Autowired
    private EntrepreneurRepository entrepreneurRepository;

    @Operation(summary = "Mettre à jour le statut d’un rendez-vous et l’intégrer à Google Calendar si accepté")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statut mis à jour, et ajouté à Google Calendar si accepté"),
            @ApiResponse(responseCode = "404", description = "Rendez-vous non trouvé"),
            @ApiResponse(responseCode = "500", description = "Erreur lors de la mise à jour ou de l’ajout à Google Calendar")
    })


    @PatchMapping("/update-status/{id}")
    public ResponseEntity<ResponseMessage> updateRendezVousStatus(@PathVariable Long id, @RequestBody RendezVous.Status status) {
        try {
            // Appeler directement updateRendezVousStatus, qui gère tout (statut + Google Calendar + sauvegarde)
            RendezVous updatedRendezVous = rendezVousService.updateRendezVousStatus(id, status);

            String message = "Statut du rendez-vous mis à jour avec succès";
            boolean success = true;

            if (RendezVous.Status.ACCEPTED.equals(status)) {
                message += " et ajouté à Google Calendar";
            }

            return ResponseEntity.ok(new ResponseMessage(message, success));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ResponseMessage("Erreur: " + e.getMessage(), false));
        }
    }


    // Classe interne pour la réponse JSON
    public static class ResponseMessage {
        private String message;
        private boolean success;

        public ResponseMessage(String message, boolean success) {
            this.message = message;
            this.success = success;
        }

        public String getMessage() {
            return message;
        }

        public boolean isSuccess() {
            return success;
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> createRendezVous(
            @RequestBody RendezVous rendezVous,
            @RequestParam Long coachId,
            @RequestParam Long entrepreneurId
    ) {
        try {
            logger.info("Début de la création du rendez-vous avec coachId={}, entrepreneurId={}", coachId, entrepreneurId);
            logger.debug("Données du rendez-vous reçu : {}", rendezVous);

            // Validate input
            logger.info("Validation des champs du rendez-vous...");
            if (rendezVous.getTitle() == null || rendezVous.getTitle().trim().isEmpty()) {
                logger.warn("Validation échouée : titre manquant ou vide");
                return ResponseEntity.badRequest().body(new ErrorResponse("Title is required"));
            }

            if (rendezVous.getDate() == null) {
                logger.warn("Validation échouée : date manquante");
                return ResponseEntity.badRequest().body(new ErrorResponse("Date is required"));
            }
            if (rendezVous.getHeure() == null || rendezVous.getHeure().trim().isEmpty()) {
                logger.warn("Validation échouée : heure manquante ou vide");
                return ResponseEntity.badRequest().body(new ErrorResponse("Heure is required"));
            }
            if (rendezVous.getDescription() == null || rendezVous.getDescription().trim().isEmpty() || rendezVous.getDescription().length() > 500) {
                logger.warn("Validation échouée : description manquante ou trop longue (> 500 caractères)");
                return ResponseEntity.badRequest().body(new ErrorResponse("Description is required and must not exceed 500 characters"));
            }
            if (rendezVous.getStatus() == null) {
                logger.info("Statut non fourni, définition par défaut à PENDING");
                rendezVous.setStatus(RendezVous.Status.PENDING);
            } else if (!rendezVous.getStatus().name().equals("PENDING") &&
                    !rendezVous.getStatus().name().equals("ACCEPTED") &&
                    !rendezVous.getStatus().name().equals("REJECTED")) {
                logger.warn("Validation échouée : statut invalide {}", rendezVous.getStatus());
                return ResponseEntity.badRequest().body(new ErrorResponse("Invalid status value"));
            }

            // Validate heure format (HH:mm)
            logger.info("Validation du format de l'heure...");
            try {
                java.time.LocalTime.parse(rendezVous.getHeure());
                logger.debug("Format de l'heure validé avec succès : {}", rendezVous.getHeure());
            } catch (java.time.format.DateTimeParseException e) {
                logger.error("Format de l'heure invalide : {}. Format attendu : HH:mm", rendezVous.getHeure(), e);
                return ResponseEntity.badRequest().body(new ErrorResponse("Invalid time format for heure. Expected format is HH:mm (e.g., 14:00)"));
            }

            // Fetch the coach and entrepreneur from the database
            logger.info("Recherche du coach avec ID={}", coachId);
            Optional<Coach> coach = coachRepository.findById(coachId);
            if (coach.isEmpty()) {
                logger.warn("Coach non trouvé pour l'ID={}", coachId);
                return ResponseEntity.badRequest().body(new ErrorResponse("Coach not found for id: " + coachId));
            }
            logger.info("Coach trouvé : {}", coach.get());

            logger.info("Recherche de l'entrepreneur avec ID={}", entrepreneurId);
            Optional<Entrepreneur> entrepreneur = entrepreneurRepository.findById(entrepreneurId);
            if (entrepreneur.isEmpty()) {
                logger.warn("Entrepreneur non trouvé pour l'ID={}", entrepreneurId);
                return ResponseEntity.badRequest().body(new ErrorResponse("Entrepreneur not found for id: " + entrepreneurId));
            }
            logger.info("Entrepreneur trouvé : {}", entrepreneur.get());

            // Set the coach and entrepreneur for the rendezvous
            rendezVous.setCoach(coach.get());
            rendezVous.setEntrepreneur(entrepreneur.get());
            logger.debug("Coach et Entrepreneur définis dans le rendez-vous : coach={}, entrepreneur={}", coach.get(), entrepreneur.get());

            // Check for time conflicts
            logger.info("Vérification des conflits de rendez-vous pour la date={} et statut=ACCEPTED", rendezVous.getDate());
            List<RendezVous> acceptedAppointments = rendezVousService.getRendezVousByDateAndStatus(rendezVous.getDate(), RendezVous.Status.ACCEPTED);
            java.time.LocalTime newTime = java.time.LocalTime.parse(rendezVous.getHeure());
            int bufferMinutes = 45;

            for (RendezVous existing : acceptedAppointments) {
                try {
                    java.time.LocalTime existingTime = java.time.LocalTime.parse(existing.getHeure());
                    long minutesDiff = java.time.Duration.between(existingTime, newTime).toMinutes();
                    if (Math.abs(minutesDiff) < bufferMinutes || minutesDiff == 0) {
                        logger.warn("Conflit de rendez-vous détecté : rendez-vous existant à {} trop proche", existing.getHeure());
                        return ResponseEntity.badRequest().body(new ErrorResponse("Time conflict: Appointment too close to an existing accepted appointment at " + existing.getHeure()));
                    }
                } catch (java.time.format.DateTimeParseException e) {
                    logger.error("Format de l'heure invalide pour un rendez-vous existant ID={} : {}. Format attendu : HH:mm", existing.getId(), existing.getHeure(), e);
                    return ResponseEntity.status(500).body(new ErrorResponse("Invalid time format in existing appointment ID=" + existing.getId() + ". Expected format is HH:mm (e.g., 14:00)"));
                }
            }
            logger.info("Aucun conflit de rendez-vous détecté");

            // Save the appointment
            logger.info("Enregistrement du rendez-vous dans la base de données...");
            RendezVous savedRendezVous = rendezVousService.createRendezVous(rendezVous);
            logger.info("Rendez-vous créé avec succès : {}", savedRendezVous);

            return ResponseEntity.ok(savedRendezVous);
        } catch (Exception e) {
            logger.error("Erreur lors de la création du rendez-vous : {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Internal server error: " + e.getMessage()));
        }
    }




    @GetMapping("/entrepreneur/{entrepreneurId}")
    public ResponseEntity<?> getRendezVousByEntrepreneurId(
            @PathVariable Long entrepreneurId,
            Authentication authentication) {
        try {
            logger.info("Fetching rendezvous for entrepreneur ID: {}", entrepreneurId);

            // Verify authenticated user
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.warn("Unauthenticated request for entrepreneur ID: {}", entrepreneurId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User is not authenticated"));
            }

            String userEmail = authentication.getName();
            Optional<Entrepreneur> entrepreneur = entrepreneurRepository.findByEmail(userEmail);
            if (entrepreneur.isEmpty()) {
                logger.warn("Entrepreneur not found for email: {}", userEmail);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Entrepreneur not found with email: " + userEmail));
            }

            // Check if user matches entrepreneurId

            if (!entrepreneur.get().getId().equals(entrepreneurId) ) {
                logger.warn("User {} is not authorized to access rendezvous for entrepreneur ID: {}", userEmail, entrepreneurId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("User is not authorized to access rendezvous for entrepreneur ID: " + entrepreneurId));
            }

            // Fetch rendezvous
            List<RendezVous> rendezVous = rendezVousService.getRendezVousByEntrepreneurId(entrepreneurId);
            logger.info("Found {} rendezvous for entrepreneur ID: {}", rendezVous.size(), entrepreneurId);
            return ResponseEntity.ok(rendezVous);
        } catch (RuntimeException e) {
            logger.error("Error fetching rendezvous for entrepreneur ID {}: {}", entrepreneurId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error fetching rendezvous for entrepreneur ID {}: {}", entrepreneurId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Unexpected error: " + e.getMessage()));
        }
    }






    // Inner class for error responses
    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }


    @GetMapping("/all")
    public ResponseEntity<List<RendezVous>> getAllRendezVous() {
        logger.info("Fetching all rendezvous");
        return ResponseEntity.ok(rendezVousService.getAllRendezVous());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RendezVous> getRendezVousById(@PathVariable Long id) {
        logger.info("Fetching rendezvous by ID: {}", id);
        Optional<RendezVous> rendezVous = rendezVousService.getRendezVousById(id);
        return rendezVous.map(ResponseEntity::ok).orElseGet(() -> {
            logger.warn("Rendezvous with ID {} not found", id);
            return ResponseEntity.notFound().build();
        });
    }



    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateRendezVous(@PathVariable Long id, @RequestBody RendezVous rendezVous) {
        logger.info("Updating rendezvous with ID: {}", id);

        try {
            // Vérifier si le rendez-vous existe
            RendezVous existingRendezVous = rendezVousService.getRendezVousById(id)
                    .orElseThrow(() -> new RuntimeException("Rendez-vous not found with id: " + id));

            // Si coach ou entrepreneur ne sont pas fournis, réutiliser les existants
            if (rendezVous.getCoach() == null || rendezVous.getCoach().getId() == null) {
                rendezVous.setCoach(existingRendezVous.getCoach());
            }
            if (rendezVous.getEntrepreneur() == null || rendezVous.getEntrepreneur().getId() == null) {
                rendezVous.setEntrepreneur(existingRendezVous.getEntrepreneur());
            }

            // Mettre à jour le rendez-vous
            RendezVous updatedRendezVous = rendezVousService.updateRendezVous(id, rendezVous);
            return ResponseEntity.ok(updatedRendezVous);
        } catch (RuntimeException e) {
            logger.error("Error updating rendezvous with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(404).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error updating rendezvous with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(500).body(new ErrorResponse("Unexpected error: " + e.getMessage()));
        }
    }
    @Operation(summary = "Obtenir les rendez-vous approuvés pour une date spécifique")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des rendez-vous approuvés récupérée avec succès"),
            @ApiResponse(responseCode = "204", description = "Aucun rendez-vous trouvé pour cette date"),
            @ApiResponse(responseCode = "400", description = "Format de date invalide"),
            @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    @GetMapping("/accepted")


    public ResponseEntity<List<RendezVous>> getAcceptedAppointmentsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "ACCEPTED") RendezVous.Status status) {
        try {
            logger.info("Fetching accepted appointments for date: {} with status: {}", date, status);
            List<RendezVous> appointments = rendezVousService.getRendezVousByDateAndStatus(date, status);
            if (appointments.isEmpty()) {
                logger.info("No accepted appointments found for date: {}", date);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(appointments);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid date format for date {}: {}", date, e.getMessage(), e);
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Server error fetching appointments for date {} and status {}: {}", date, status, e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteRendezVous(@PathVariable Long id) {
        logger.info("Deleting rendezvous ID: {}", id);
        rendezVousService.deleteRendezVous(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<?> getRendezVousByCoach(
            @PathVariable Long coachId,
            Authentication authentication) {
        try {
            logger.info("Fetching rendezvous for coach ID: {}", coachId);

            // Verify authenticated user
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.warn("Unauthenticated request for coach ID: {}", coachId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User is not authenticated"));
            }

            String userEmail = authentication.getName();
            Optional<Coach> coach = coachRepository.findByEmail(userEmail);
            if (coach.isEmpty()) {
                logger.warn("Coach not found for email: {}", userEmail);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Coach not found with email: " + userEmail));
            }

            // Check if user matches coachId

            if (!coach.get().getId().equals(coachId)) {
                logger.warn("User {} is not authorized to access rendezvous for coach ID: {}", userEmail, coachId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("User is not authorized to access rendezvous for coach ID: " + coachId));
            }

            // Fetch rendezvous
            List<RendezVous> rendezVous = rendezVousService.getRendezVousByCoachId(coachId);
            logger.info("Found {} rendezvous for coach ID: {}", rendezVous.size(), coachId);
            return ResponseEntity.ok(rendezVous);
        } catch (RuntimeException e) {
            logger.error("Error fetching rendezvous for coach ID {}: {}", coachId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error fetching rendezvous for coach ID {}: {}", coachId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Unexpected error: " + e.getMessage()));
        }
    }




    // Endpoint to fetch the list of coaches
    @GetMapping("api/coachlist")
    @Operation(summary = "Récupérer la liste dynamique des coachs")
    public ResponseEntity<List<Coach>> getCoachList() {
        List<Coach> coaches = coachRepository.findAll(); // Fetch all coaches
        return ResponseEntity.ok(coaches);
    }



    // Endpoint to fetch a coach by ID
    @GetMapping("api/coachlist/{id}")
    @Operation(summary = "Récupérer un coach par son ID")
    public ResponseEntity<Coach> getCoachById(@PathVariable Long id) {
        Optional<Coach> coach = coachRepository.findById(id);
        return coach.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/joinable/entrepreneur/{entrepreneurId}")
    public ResponseEntity<RendezVousDTO> getJoinableRendezVousForEntrepreneur(@PathVariable Long entrepreneurId) {
        logger.info("Fetching joinable rendezvous for entrepreneur ID: {}", entrepreneurId);
        Optional<RendezVousDTO> rendezVous = rendezVousService.getJoinableRendezVousForEntrepreneur(entrepreneurId);
        return rendezVous.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/joinable/coach/{coachId}")
    public ResponseEntity<RendezVousDTO> getJoinableRendezVousForCoach(@PathVariable Long coachId) {
        Optional<RendezVousDTO> rendezVousDTO = rendezVousService.getJoinableRendezVousForCoach(coachId);
        return rendezVousDTO.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(null)); // Return 200 with null or empty body
    }





    @GetMapping("/history/{userId}")
    public ResponseEntity<List<RendezVous>> getUserAppointmentHistory(@PathVariable Long userId) {
        logger.info("Fetching appointment history for user ID: {}", userId);
        try {
            List<RendezVous> rendezVous = rendezVousService.getRendezVousByUserId(userId);
            return ResponseEntity.ok(rendezVous);
        } catch (RuntimeException e) {
            logger.warn("No appointments found for user ID: {}", userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error fetching appointment history for user ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/stats/{userId}")
    public ResponseEntity<Map<String, Long>> getStatsByUser(@PathVariable Long userId) {
        Map<String, Long> stats = rendezVousService.getStatsByUser(userId);
        return ResponseEntity.ok(stats);
    }






}