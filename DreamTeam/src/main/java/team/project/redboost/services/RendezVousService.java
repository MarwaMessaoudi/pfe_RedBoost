package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Entrepreneur;
import team.project.redboost.entities.RendezVous;
import team.project.redboost.entities.Coach;
import team.project.redboost.entities.RendezVousDTO;
import team.project.redboost.repositories.CoachRepository;
import team.project.redboost.repositories.EntrepreneurRepository;
import team.project.redboost.repositories.RendezVousRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class RendezVousService {

    @Autowired
    private RendezVousRepository rendezVousRepository;

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private EntrepreneurRepository entrepreneurRepository;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Added for WebSocket

    public Optional<RendezVous> getRendezVousById(Long id) {
        return rendezVousRepository.findById(id);
    }

    public RendezVous createRendezVous(RendezVous rendezVous) {
        if (rendezVous.getStatus() == null) {
            rendezVous.setStatus(RendezVous.Status.PENDING);
        }
        RendezVous savedRendezVous = rendezVousRepository.save(rendezVous);
        // Broadcast to both coach and entrepreneur
        broadcastRendezVousUpdate(savedRendezVous, "create");
        return savedRendezVous;
    }

    public List<RendezVous> getRendezVousByEntrepreneurId(Long entrepreneurId) {
        if (entrepreneurId == null) {
            throw new IllegalArgumentException("L'ID de l'entrepreneur ne peut pas être null");
        }
        if (!entrepreneurRepository.existsById(entrepreneurId)) {
            throw new RuntimeException("Entrepreneur non trouvé avec l'ID: " + entrepreneurId);
        }
        List<RendezVous> rendezVous = rendezVousRepository.findByEntrepreneurId(entrepreneurId);
        return rendezVous != null ? rendezVous : Collections.emptyList();
    }

    public List<RendezVous> getRendezVousByCoachId(Long coachId) {
        if (coachId == null) {
            throw new IllegalArgumentException("L'ID du coach ne peut pas être null");
        }
        if (!coachRepository.existsById(coachId)) {
            throw new RuntimeException("Coach non trouvé avec l'ID: " + coachId);
        }
        List<RendezVous> rendezVous = rendezVousRepository.findByCoachId(coachId);
        return rendezVous != null ? rendezVous : Collections.emptyList();
    }

    public List<RendezVous> getAllRendezVous() {
        return rendezVousRepository.findAll();
    }

    public RendezVous updateRendezVous(Long id, RendezVous newRendezVous) {
        RendezVous updatedRendezVous = rendezVousRepository.findById(id)
                .map(existingRdv -> {
                    if (newRendezVous.getTitle() != null) {
                        existingRdv.setTitle(newRendezVous.getTitle());
                    }
                    if (newRendezVous.getDate() != null) {
                        existingRdv.setDate(newRendezVous.getDate());
                    }
                    if (newRendezVous.getHeure() != null) {
                        existingRdv.setHeure(newRendezVous.getHeure());
                    }
                    if (newRendezVous.getDescription() != null) {
                        existingRdv.setDescription(newRendezVous.getDescription());
                    }
                    if (newRendezVous.getStatus() != null) {
                        existingRdv.setStatus(newRendezVous.getStatus());
                    }
                    if (newRendezVous.getMeetingLink() != null) {
                        existingRdv.setMeetingLink(newRendezVous.getMeetingLink());
                    }
                    if (newRendezVous.getCoach() != null && newRendezVous.getCoach().getId() != null) {
                        Coach coach = coachRepository.findById(newRendezVous.getCoach().getId())
                                .orElseThrow(() -> new RuntimeException("Coach not found with id: " + newRendezVous.getCoach().getId()));
                        existingRdv.setCoach(coach);
                    }
                    if (newRendezVous.getEntrepreneur() != null && newRendezVous.getEntrepreneur().getId() != null) {
                        Entrepreneur entrepreneur = entrepreneurRepository.findById(newRendezVous.getEntrepreneur().getId())
                                .orElseThrow(() -> new RuntimeException("Entrepreneur not found with id: " + newRendezVous.getEntrepreneur().getId()));
                        existingRdv.setEntrepreneur(entrepreneur);
                    }
                    return rendezVousRepository.save(existingRdv);
                })
                .orElseThrow(() -> new RuntimeException("Rendez-vous not found with id: " + id));
        // Broadcast update
        broadcastRendezVousUpdate(updatedRendezVous, "update");
        return updatedRendezVous;
    }

    public List<RendezVous> getRendezVousByDateAndStatus(LocalDate date, RendezVous.Status status) {
        return rendezVousRepository.findByDateAndStatus(date, status);
    }

    public RendezVous updateRendezVousStatus(Long id, RendezVous.Status status) {
        RendezVous updatedRendezVous = rendezVousRepository.findById(id)
                .map(existingRdv -> {
                    existingRdv.setStatus(status);
                    if (status == RendezVous.Status.ACCEPTED) {
                        googleCalendarService.ajouterRendezVous(existingRdv);
                    }
                    return rendezVousRepository.save(existingRdv);
                })
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé avec l'id: " + id));
        // Broadcast status update
        broadcastRendezVousUpdate(updatedRendezVous, "update");
        return updatedRendezVous;
    }

    public void deleteRendezVous(Long id) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé avec l'id: " + id));
        rendezVousRepository.deleteById(id);
        // Broadcast deletion
        broadcastRendezVousDelete(id, rendezVous.getCoach().getId(), rendezVous.getEntrepreneur().getId());
    }

    private boolean canJoinNow(RendezVous rendezVous) {
        if (!rendezVous.getStatus().equals(RendezVous.Status.ACCEPTED)) {
            return false;
        }
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalTime heureDebut = LocalTime.parse(rendezVous.getHeure());
            LocalDateTime rendezVousStart = LocalDateTime.of(rendezVous.getDate(), heureDebut);
            LocalDateTime joinWindowStart = rendezVousStart.minusMinutes(5);
            LocalDateTime joinWindowEnd = rendezVousStart.plusMinutes(5);
            return now.isAfter(joinWindowStart) && now.isBefore(joinWindowEnd);
        } catch (Exception e) {
            return false;
        }
    }

    private RendezVousDTO toDTO(RendezVous rendezVous) {
        return new RendezVousDTO(
                rendezVous.getId(),
                rendezVous.getTitle(),
                rendezVous.getDate(),
                rendezVous.getHeure(),
                rendezVous.getDescription(),
                rendezVous.getMeetingLink(),
                rendezVous.getStatus().name(),
                rendezVous.getCoach() != null ? rendezVous.getCoach().getId() : null,
                rendezVous.getEntrepreneur() != null ? rendezVous.getEntrepreneur().getId() : null,
                canJoinNow(rendezVous)
        );
    }

    public Optional<RendezVousDTO> getJoinableRendezVousForEntrepreneur(Long entrepreneurId) {
        if (entrepreneurId == null) {
            throw new IllegalArgumentException("L'ID de l'entrepreneur ne peut pas être null");
        }
        Optional<Entrepreneur> entrepreneur = entrepreneurRepository.findById(entrepreneurId);
        if (entrepreneur.isEmpty()) {
            throw new RuntimeException("Entrepreneur non trouvé avec l'id: " + entrepreneurId);
        }
        return rendezVousRepository.findByEntrepreneur(entrepreneur.get())
                .stream()
                .filter(this::canJoinNow)
                .findFirst()
                .map(this::toDTO);
    }

    public Optional<RendezVousDTO> getJoinableRendezVousForCoach(Long coachId) {
        if (coachId == null) {
            throw new IllegalArgumentException("L'ID du coach ne peut pas être null");
        }
        Optional<Coach> coach = coachRepository.findById(coachId);
        if (coach.isEmpty()) {
            System.out.println("No coach found with ID: " + coachId);
            return Optional.empty();
        }
        return rendezVousRepository.findByCoach(coach.get())
                .stream()
                .filter(this::canJoinNow)
                .findFirst()
                .map(this::toDTO);
    }

    public List<RendezVous> getRendezVousByUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("L'ID de l'utilisateur ne peut pas être null");
        }
        List<RendezVous> rendezVous = rendezVousRepository.findByUserId(userId);
        if (rendezVous.isEmpty()) {
            throw new RuntimeException("Aucun rendez-vous trouvé pour cet utilisateur");
        }
        return rendezVous;
    }

    public Map<String, Long> getStatsByUser(Long userId) {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", rendezVousRepository.countAllByUser(userId));
        stats.put("accepted", rendezVousRepository.countAcceptedByUser(userId));
        stats.put("pending", rendezVousRepository.countPendingByUser(userId));
        stats.put("rejected", rendezVousRepository.countRejectedByUser(userId));
        return stats;
    }

    private void broadcastRendezVousUpdate(RendezVous rendezVous, String action) {
        RendezVousDTO rendezVousDTO = toDTO(rendezVous);
        // Broadcast to coach
        if (rendezVous.getCoach() != null && rendezVous.getCoach().getId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/rendezvous/" + rendezVous.getCoach().getId(),
                    new RendezVousUpdate(rendezVousDTO, action)
            );
        }
        // Broadcast to entrepreneur
        if (rendezVous.getEntrepreneur() != null && rendezVous.getEntrepreneur().getId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/rendezvous/" + rendezVous.getEntrepreneur().getId(),
                    new RendezVousUpdate(rendezVousDTO, action)
            );
        }
    }

    private void broadcastRendezVousDelete(Long id, Long coachId, Long entrepreneurId) {
        // Broadcast deletion to coach
        if (coachId != null) {
            messagingTemplate.convertAndSend(
                    "/topic/rendezvous/" + coachId,
                    new RendezVousUpdate(id, "delete")
            );
        }
        // Broadcast deletion to entrepreneur
        if (entrepreneurId != null) {
            messagingTemplate.convertAndSend(
                    "/topic/rendezvous/" + entrepreneurId,
                    new RendezVousUpdate(id, "delete")
            );
        }
    }

    // Inner class for WebSocket messages
    public static class RendezVousUpdate {
        private RendezVousDTO rendezVous;
        private Long id;
        private String action;

        public RendezVousUpdate(RendezVousDTO rendezVous, String action) {
            this.rendezVous = rendezVous;
            this.action = action;
        }

        public RendezVousUpdate(Long id, String action) {
            this.id = id;
            this.action = action;
        }

        public RendezVousDTO getRendezVous() {
            return rendezVous;
        }

        public Long getId() {
            return id;
        }

        public String getAction() {
            return action;
        }
    }
}