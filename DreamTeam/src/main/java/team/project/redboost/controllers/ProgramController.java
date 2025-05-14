package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Program;
import team.project.redboost.entities.ProgramStatus;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.services.CloudinaryService;
import team.project.redboost.services.EmailService;
import team.project.redboost.services.ProgramService;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/programs")
@RequiredArgsConstructor
public class ProgramController {
    @Autowired
    private CloudinaryService cloudinaryService;

    private final ProgramService programService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addProgram(
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam Double budget,
            @RequestParam Long programLeadId,
            @RequestParam(required = false) MultipartFile logo
    ) throws IOException {
        try {
            User lead = userRepository.findById(programLeadId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            Program program = programService.createProgram(name, description, startDate, endDate, budget, logo, lead);

            String message = """
                    Bonjour %s,

                    Vous avez été désigné responsable du programme suivant : %s

                    Dates : %s → %s
                    Budget : %.2f €

                    Veuillez vous connecter à la plateforme pour consulter les détails.
                    """.formatted(lead.getFirstName(), name, startDate, endDate, budget);

            emailService.sendEmail(lead.getEmail(), "✅ Nouveau programme assigné", message);

            return ResponseEntity.ok(program);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l’ajout du programme : " + e.getMessage());
        }
    }

    @GetMapping
    public List<Program> getAllPrograms() {
        return programService.getAllProgramsRaw();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Program> getProgramById(@PathVariable Long id) {
        return ResponseEntity.ok(programService.getProgramByIdRaw(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Program>> searchPrograms(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "asc") String sort,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(programService.searchProgramsRaw(name, status, sort, startDate, endDate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProgram(@PathVariable Long id) {
        programService.deleteProgramById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProgram(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam Double budget,
            @RequestParam Long programLeadId,
            @RequestParam(required = false) MultipartFile logo,
            @RequestParam(required = false) String status
    ) throws IOException {
        try {
            // Validate program existence
            Program existingProgram = programService.getProgramByIdRaw(id);
            if (existingProgram == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Programme introuvable avec l'ID : " + id);
            }

            // Validate program lead
            User lead = userRepository.findById(programLeadId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            // Validate logo if provided
            if (logo != null && !logo.isEmpty()) {
                validateLogoFile(logo);
            }

            // Parse status
            ProgramStatus programStatus = status != null ? ProgramStatus.valueOf(status.toUpperCase()) : existingProgram.getStatus();

            // Update program
            Program updatedProgram = programService.updateProgram(
                    id, name, description, startDate, endDate, budget, logo, lead, programStatus);

            // Send email notification to the program lead
            String message = """
                    Bonjour %s,

                    Les détails du programme suivant ont été mis à jour : %s

                    Dates : %s → %s
                    Budget : %.2f €
                    Statut : %s

                    Veuillez vous connecter à la plateforme pour consulter les détails.
                    """.formatted(lead.getFirstName(), name, startDate, endDate, budget, programStatus);

            emailService.sendEmail(lead.getEmail(), "📝 Programme mis à jour", message);

            return ResponseEntity.ok(updatedProgram);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Statut invalide : " + status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la mise à jour du programme : " + e.getMessage());
        }
    }

    private void validateLogoFile(MultipartFile logo) {
        // Check file size (5MB limit)
        long maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (logo.getSize() > maxSize) {
            throw new IllegalArgumentException("Le fichier logo dépasse la taille maximale de 5 Mo.");
        }

        // Check file type (allow only images)
        String contentType = logo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Le fichier logo doit être une image (JPEG, PNG, etc.).");
        }
    }

    private String extractPublicIdFromUrl(String logoUrl) {
        // Example URL: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/public_id.jpg
        try {
            String[] parts = logoUrl.split("/");
            String lastPart = parts[parts.length - 1]; // e.g., public_id.jpg
            return lastPart.substring(0, lastPart.lastIndexOf(".")); // e.g., public_id
        } catch (Exception e) {
            System.err.println("Failed to extract public ID from logo URL: " + logoUrl);
            return null;
        }
    }
}