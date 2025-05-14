package team.project.redboost.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import team.project.redboost.dto.NotificationDTO;
import team.project.redboost.dto.StatisticsDTOs.*;
import team.project.redboost.entities.Coach;
import team.project.redboost.entities.Projet;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.services.ProjetService;
import team.project.redboost.services.CloudinaryService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import jakarta.transaction.Transactional;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/projets")
public class ProjetController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final ProjetService projetService;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;

    public ProjetController(ProjetService projetService, CloudinaryService cloudinaryService,
                            SimpMessagingTemplate messagingTemplate, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.projetService = projetService;
        this.cloudinaryService = cloudinaryService;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping(value = "/AddProjet", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProjet(
            @RequestPart("projet") String projetJson,
            @RequestPart(value = "logourl", required = false) MultipartFile file) {
        try {
            User user = projetService.getCurrentUser();
            Long entrepreneurId = user.getId();
            Projet projet = objectMapper.readValue(projetJson, Projet.class);
            String imageUrl = null;
            if (file != null && !file.isEmpty()) {
                imageUrl = cloudinaryService.uploadImage(file);
            }
            Projet savedProjet = projetService.createProjet(projet, imageUrl, entrepreneurId);
            return ResponseEntity.ok(savedProjet);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error during project creation: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to create a project");
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PutMapping(value = "/UpdateProjet/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProjet(
            @PathVariable Long id,
            @RequestPart("projet") String projetJson,
            @RequestPart(value = "logourl", required = false) MultipartFile file) {
        try {
            Projet projetDetails = objectMapper.readValue(projetJson, Projet.class);
            String imageUrl = null;
            if (file != null && !file.isEmpty()) {
                imageUrl = cloudinaryService.uploadImage(file);
            }
            Projet updatedProjet = projetService.updateProjet(id, projetDetails, imageUrl);
            return ResponseEntity.ok(updatedProjet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project not found with ID: " + id);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error during file upload: " + e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to update project ID: " + id);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR','SUPERADMIN','ADMIN')")
    @GetMapping("/GetAll")
    public ResponseEntity<?> getAllProjets() {
        try {
            List<Projet> projets = projetService.getAllProjets();
            return ResponseEntity.ok(projets);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access project list");
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/GetProjet/{id}")
    public ResponseEntity<?> getProjetById(@PathVariable Long id) {
        try {
            Projet projet = projetService.getProjetById(id);
            return ResponseEntity.ok(projet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project not found with ID: " + id);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access project ID: " + id);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @DeleteMapping("/DeleteProjet/{id}")
    public ResponseEntity<?> deleteProjet(@PathVariable Long id) {
        try {
            projetService.deleteProjet(id);
            return ResponseEntity.ok("Projet deleted successfully!");
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project not found with ID: " + id);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to delete project ID: " + id);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @GetMapping("/Getcardfounder/{userId}")
    public ResponseEntity<?> getProjetCardByUserId(@PathVariable Long userId) {
        try {
            List<Object[]> projectCards = projetService.getProjetCardByUserId(userId);
            return ResponseEntity.ok(projectCards);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access project cards for user ID: " + userId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping("/{projetId}/entrepreneur/{userId}")
    public ResponseEntity<?> addEntrepreneurToProject(
            @PathVariable Long projetId,
            @PathVariable Long userId) {
        try {
            Projet updatedProjet = projetService.addEntrepreneurToProjet(projetId, userId);
            return ResponseEntity.ok(updatedProjet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project or user not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to add entrepreneur to project ID: " + projetId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @GetMapping("/entrepreneur/{userId}/coaches")
    public ResponseEntity<?> getCoachesForEntrepreneur(@PathVariable Long userId) {
        try {
            List<Coach> coaches = projetService.getCoachesForEntrepreneur(userId);
            return ResponseEntity.ok(coaches);
        } catch (RuntimeException e) {
            if (e instanceof SecurityException) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("User is not authorized to access coaches for entrepreneur ID: " + userId);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No coaches found for entrepreneur with ID: " + userId);
        }
    }
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @PostMapping("/{projetId}/coach/{userId}")
    public ResponseEntity<?> addCoachToProjet(
            @PathVariable Long projetId,
            @PathVariable Long userId) {
        try {
            Projet updatedProjet = projetService.addCoachToProjet(projetId, userId);
            return ResponseEntity.ok(updatedProjet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project or user not found");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to add coach to project ID: " + projetId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping("/{projetId}/investor/{userId}")
    public ResponseEntity<?> addInvestorToProjet(
            @PathVariable Long projetId,
            @PathVariable Long userId) {
        try {
            Projet updatedProjet = projetService.addInvestorToProjet(projetId, userId);
            return ResponseEntity.ok(updatedProjet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project or user not found");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to add investor to project ID: " + projetId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping("/{projetId}/invite/{userId}")
    public ResponseEntity<?> inviteCollaborator(
            @PathVariable Long projetId,
            @PathVariable Long userId) {
        try {
            Projet updatedProjet = projetService.inviteCollaborator(projetId, userId);
            User invitor = updatedProjet.getFounder();
            User invitedUser = userRepository.findById(userId)
                    .orElseThrow(() -> new NoSuchElementException("User not found"));
            NotificationDTO notification = NotificationDTO.builder()
                    .type("INVITATION")
                    .projectId(projetId)
                    .projectName(updatedProjet.getName())
                    .senderId(invitor.getId())
                    .senderName(invitor.getFirstName())
                    .invitorEmail(invitor.getEmail())
                    .timestamp(LocalDateTime.now().toString())
                    .build();
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + userId,
                    notification);
            return ResponseEntity.ok(updatedProjet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project or user not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to invite collaborator to project ID: " + projetId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping("/{projetId}/accept/{userId}")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable Long projetId,
            @PathVariable Long userId) {
        try {
            Projet updatedProjet = projetService.acceptInvitation(projetId, userId);
            return ResponseEntity.ok(updatedProjet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project or user not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to accept invitation for project ID: " + projetId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping("/{projetId}/decline/{userId}")
    public ResponseEntity<?> declineInvitation(
            @PathVariable Long projetId,
            @PathVariable Long userId) {
        try {
            Projet updatedProjet = projetService.declineInvitation(projetId, userId);
            return ResponseEntity.ok(updatedProjet);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project or user not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to decline invitation for project ID: " + projetId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @GetMapping("/{projetId}/eligible-collaborators")
    @Transactional
    public ResponseEntity<?> getEligibleCollaborators(@PathVariable Long projetId) {
        try {
            Projet projet = projetService.findProjetEntityById(projetId);
            User currentUser = projetService.getCurrentUser();
            if (!currentUser.getId().equals(projet.getFounder().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("User is not authorized to view eligible collaborators for project ID: " + projetId);
            }
            List<User> allEntrepreneurs = userRepository.findByRole(Role.ENTREPRENEUR);
            List<User> eligibleCollaborators = allEntrepreneurs.stream()
                    .filter(user -> !projet.getEntrepreneurs().contains(user))
                    .filter(user -> projet.getPendingCollaborator() == null || !projet.getPendingCollaborator().getId().equals(user.getId()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(eligibleCollaborators);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project not found with ID: " + projetId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access eligible collaborators for project ID: " + projetId);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @GetMapping("/pending-invitations")
    @Transactional
    public ResponseEntity<?> getPendingInvitations() {
        try {
            User currentUser = projetService.getCurrentUser();
            List<Projet> allProjects = projetService.getAllProjets();
            List<Object> pendingInvitations = allProjects.stream()
                    .filter(projet -> projet.getPendingCollaborator() != null &&
                            projet.getPendingCollaborator().getId().equals(currentUser.getId()))
                    .map(projet -> new Object() {
                        public final Long projectId = projet.getId();
                        public final String projectName = projet.getName();
                        public final String invitorEmail = projet.getFounder().getEmail();
                        public final String invitorName = projet.getFounder().getFirstName();
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(pendingInvitations);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access pending invitations");
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/{projetId}/contacts")
    public ResponseEntity<?> getProjectContacts(@PathVariable Long projetId) {
        try {
            Map<String, Object> contacts = projetService.getProjectContacts(projetId);
            return ResponseEntity.ok(contacts);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project not found with ID: " + projetId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access contacts for project ID: " + projetId);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/marketplace")
    public ResponseEntity<?> getMarketplaceProjects() {
        try {
            List<Projet> projects = projetService.getAllProjectsLimited();
            return ResponseEntity.ok(projects);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access marketplace projects");
        }
    }

    @PreAuthorize("hasRole('COACH')")
    @GetMapping("/coach/{userId}")
    public ResponseEntity<?> getProjectsByCoach(@PathVariable Long userId) {
        try {
            List<Projet> projects = projetService.getProjectsByCoach(userId);
            return ResponseEntity.ok(projects);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found with ID: " + userId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access projects for coach ID: " + userId);
        }
    }

    @PreAuthorize("hasRole('COACH')")
    @GetMapping("/coach/{userId}/statistics")
    public ResponseEntity<?> getCoachDashboardStatistics(@PathVariable Long userId) {
        try {
            DashboardStatisticsDTO stats = projetService.getCoachDashboardStatistics(userId);
            return ResponseEntity.ok(stats);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found with ID: " + userId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access statistics for coach ID: " + userId);
        }
    }
}