package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.ReclamationDTO;
import team.project.redboost.entities.Reclamation;
import team.project.redboost.entities.User;
import team.project.redboost.entities.StatutReclamation;
import team.project.redboost.repositories.ReclamationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReclamationService {
    private static final Logger logger = LoggerFactory.getLogger(ReclamationService.class);

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // Create a new reclamation with optional file upload
    public Reclamation createReclamation(Reclamation reclamation, MultipartFile file) throws IOException {
        if (file != null && !file.isEmpty()) {
            logger.info("Uploading file: {}", file.getOriginalFilename());
            String fileUrl = cloudinaryService.uploadImage(file);
            reclamation.setFichierReclamation(fileUrl);
            logger.info("File uploaded successfully, URL: {}", fileUrl);
        }
        return reclamationRepository.save(reclamation);
    }

    // Get all reclamations for a specific user (by user ID)
    public List<Reclamation> getReclamationsByUserId(Long userId) {
        return reclamationRepository.findByUser_Id(userId);
    }

    // Get all reclamations for a specific user (by user object)
    public List<Reclamation> getReclamationsByUser(User user) {
        return reclamationRepository.findByUser(user);
    }

    // Get all reclamations (for ADMIN only) with user details
    public List<ReclamationDTO> getAllReclamations() {
        return reclamationRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // Get a reclamation by ID and user
    public Reclamation getReclamationByIdAndUser(Long idReclamation, User user) {
        Optional<Reclamation> reclamation = reclamationRepository.findByIdReclamationAndUser(idReclamation, user);
        return reclamation.orElse(null);
    }

    // Update a reclamation
    public Reclamation updateReclamation(Long id, Reclamation reclamationDetails, User user) {
        Optional<Reclamation> reclamationOptional = reclamationRepository.findByIdReclamationAndUser(id, user);
        if (reclamationOptional.isPresent()) {
            Reclamation reclamation = reclamationOptional.get();
            reclamation.setSujet(reclamationDetails.getSujet());
            reclamation.setDate(reclamationDetails.getDate());
            reclamation.setStatut(reclamationDetails.getStatut());
            reclamation.setDescription(reclamationDetails.getDescription());
            reclamation.setCategorie(reclamationDetails.getCategorie());
            reclamation.setFichierReclamation(reclamationDetails.getFichierReclamation());
            return reclamationRepository.save(reclamation);
        }
        return null;
    }

    // Delete a reclamation
    public boolean deleteReclamation(Long id, User user) {
        Optional<Reclamation> reclamationOptional = reclamationRepository.findByIdReclamationAndUser(id, user);
        if (reclamationOptional.isPresent()) {
            Reclamation reclamation = reclamationOptional.get();
            if (reclamation.getFichierReclamation() != null) {
                try {
                    String publicId = extractPublicIdFromUrl(reclamation.getFichierReclamation());
                    cloudinaryService.deleteImage(publicId);
                    logger.info("File deleted from Cloudinary: {}", publicId);
                } catch (IOException e) {
                    logger.error("Failed to delete image from Cloudinary", e);
                }
            }
            reclamationRepository.delete(reclamationOptional.get());
            return true;
        }
        return false;
    }

    // Update reclamation status
    public Reclamation updateReclamationStatut(Long idReclamation, StatutReclamation nouveauStatut) {
        return reclamationRepository.findById(idReclamation)
                .map(reclamation -> {
                    reclamation.setStatut(nouveauStatut);
                    return reclamationRepository.save(reclamation);
                })
                .orElse(null);
    }

    // Map Reclamation to ReclamationDTO
    private ReclamationDTO mapToDTO(Reclamation reclamation) {
        ReclamationDTO dto = new ReclamationDTO();
        dto.setIdReclamation(reclamation.getIdReclamation());
        dto.setSujet(reclamation.getSujet());
        dto.setDate(reclamation.getDate());
        dto.setStatut(reclamation.getStatut());
        dto.setDescription(reclamation.getDescription());
        dto.setCategorie(reclamation.getCategorie());
        dto.setFichierReclamation(reclamation.getFichierReclamation());
        if (reclamation.getUser() != null) {
            dto.setUserId(reclamation.getUser().getId());
            dto.setEmail(reclamation.getUser().getEmail());
        }
        return dto;
    }

    // Helper method to extract public ID from Cloudinary URL
    private String extractPublicIdFromUrl(String url) {
        if (url == null) return null;
        String[] parts = url.split("/");
        String fileName = parts[parts.length - 1];
        return fileName.substring(0, fileName.lastIndexOf('.'));
    }
}