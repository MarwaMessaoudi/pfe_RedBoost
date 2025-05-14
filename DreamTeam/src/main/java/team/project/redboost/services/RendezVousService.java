package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Entrepreneur;
import team.project.redboost.entities.RendezVous;
import team.project.redboost.entities.Coach;
import team.project.redboost.entities.RendezVousDTO;
import team.project.redboost.repositories.CoachRepository;
import team.project.redboost.repositories.EntrepreneurRepository;

import team.project.redboost.repositories.RendezVousRepository;

import java.net.http.HttpHeaders;
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



    public Optional<RendezVous> getRendezVousById(Long id) {
        return rendezVousRepository.findById(id);
    }
    // Créer un rendez-vous avec statut "PENDING" par défaut
    public RendezVous createRendezVous(RendezVous rendezVous) {
        if (rendezVous.getStatus() == null) {
            rendezVous.setStatus(RendezVous.Status.PENDING); // Assurer que le statut est "PENDING" par défaut
        }
        return rendezVousRepository.save(rendezVous);
    }
    public List<RendezVous> getRendezVousByEntrepreneurId(Long entrepreneurId) {
        if (entrepreneurId == null) {
            throw new IllegalArgumentException("L'ID de l'entrepreneur ne peut pas être null");
        }
        // Verify entrepreneur exists
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
        // Verify coach exists
        if (!coachRepository.existsById(coachId)) {
            throw new RuntimeException("Coach non trouvé avec l'ID: " + coachId);
        }
        List<RendezVous> rendezVous = rendezVousRepository.findByCoachId(coachId);
        return rendezVous != null ? rendezVous : Collections.emptyList();
    }




    // Récupérer tous les rendez-vous
    public List<RendezVous> getAllRendezVous() {
        return rendezVousRepository.findAll();
    }



    public RendezVous updateRendezVous(Long id, RendezVous newRendezVous) {
        return rendezVousRepository.findById(id)
                .map(existingRdv -> {
                    // Mettre à jour les champs simples
                    if (newRendezVous.getTitle() != null) {
                        existingRdv.setTitle(newRendezVous.getTitle());
                    }
                    if (newRendezVous.getEmail() != null) {
                        existingRdv.setEmail(newRendezVous.getEmail());
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

                    // Charger et mettre à jour le coach si fourni
                    if (newRendezVous.getCoach() != null && newRendezVous.getCoach().getId() != null) {
                        Coach coach = coachRepository.findById(newRendezVous.getCoach().getId())
                                .orElseThrow(() -> new RuntimeException("Coach not found with id: " + newRendezVous.getCoach().getId()));
                        existingRdv.setCoach(coach);
                    }

                    // Charger et mettre à jour l'entrepreneur si fourni
                    if (newRendezVous.getEntrepreneur() != null && newRendezVous.getEntrepreneur().getId() != null) {
                        Entrepreneur entrepreneur = entrepreneurRepository.findById(newRendezVous.getEntrepreneur().getId())
                                .orElseThrow(() -> new RuntimeException("Entrepreneur not found with id: " + newRendezVous.getEntrepreneur().getId()));
                        existingRdv.setEntrepreneur(entrepreneur);
                    }

                    return rendezVousRepository.save(existingRdv);
                })
                .orElseThrow(() -> new RuntimeException("Rendez-vous not found with id: " + id));
    }



    public List<RendezVous> getRendezVousByDateAndStatus(LocalDate date, RendezVous.Status status) {
        return rendezVousRepository.findByDateAndStatus(date, status);
    }

    // Mettre à jour uniquement le statut d’un rendez-vous
    /*public RendezVous updateRendezVousStatus(Long id, RendezVous.Status status) {
        return rendezVousRepository.findById(id)
                .map(existingRdv -> {
                    existingRdv.setStatus(status);
                    return rendezVousRepository.save(existingRdv);
                })
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé avec l'id: " + id));
    }*/
    public RendezVous updateRendezVousStatus(Long id, RendezVous.Status status) {
        return rendezVousRepository.findById(id)
                .map(existingRdv -> {
                    existingRdv.setStatus(status);

                    // Si le statut est ACCEPTED, générer un lien Google Meet
                    if (status == RendezVous.Status.ACCEPTED) {
                        googleCalendarService.ajouterRendezVous(existingRdv);
                    }

                    return rendezVousRepository.save(existingRdv); // Sauvegarde l'objet modifié
                })
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé avec l'id: " + id));
    }

    public void deleteRendezVous(Long id) {
        if (!rendezVousRepository.existsById(id)) {
            throw new RuntimeException("Rendez-vous non trouvé avec l'id: " + id);
        }
        rendezVousRepository.deleteById(id);
    }


    /*ezkbfjze*/



    // Méthode pour vérifier si un rendez-vous est joignable
    private boolean canJoinNow(RendezVous rendezVous) {
        if (!rendezVous.getStatus().equals(RendezVous.Status.ACCEPTED)) {
            return false;
        }

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalTime heureDebut = LocalTime.parse(rendezVous.getHeure());
            LocalDateTime rendezVousStart = LocalDateTime.of(rendezVous.getDate(), heureDebut);
            LocalDateTime joinWindowStart = rendezVousStart.minusMinutes(5);
            LocalDateTime joinWindowEnd = rendezVousStart.plusMinutes(5);    // 5 minutes after the meeting

            return now.isAfter(joinWindowStart) && now.isBefore(joinWindowEnd);
        } catch (Exception e) {
            return false;
        }
    }

    // Convertir un RendezVous en RendezVousDTO
    private RendezVousDTO toDTO(RendezVous rendezVous) {
        return new RendezVousDTO(
                rendezVous.getId(),
                rendezVous.getTitle(),
                rendezVous.getEmail(),
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



    // Récupérer un rendez-vous joignable pour un entrepreneur
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

    // Récupérer un rendez-vous joignable pour un coach
    public Optional<RendezVousDTO> getJoinableRendezVousForCoach(Long coachId) {
        if (coachId == null) {
            throw new IllegalArgumentException("L'ID du coach ne peut pas être null");
        }
        Optional<Coach> coach = coachRepository.findById(coachId);
        if (coach.isEmpty()) {
            // Log the issue but return an empty Optional instead of throwing an exception
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



}