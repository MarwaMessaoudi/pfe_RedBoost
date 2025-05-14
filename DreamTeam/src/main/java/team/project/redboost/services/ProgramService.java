package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Program;
import team.project.redboost.entities.ProgramStatus;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.ProgramRepository;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgramService {

    private final ProgramRepository repository;
    private final CloudinaryService cloudinaryService;

    public Program createProgram(String name, String description, LocalDate start, LocalDate end,
                                 Double budget, MultipartFile logo, User lead) throws IOException {
        String logoUrl = null;
        if (logo != null && !logo.isEmpty()) {
            logoUrl = cloudinaryService.uploadImage(logo); // Directly get the URL as String
        }

        Program program = Program.builder()
                .name(name)
                .description(description)
                .startDate(start)
                .endDate(end)
                .budget(budget)
                .logoUrl(logoUrl)
                .programLead(lead)
                .status(ProgramStatus.ENATTENTE)
                .build();

        return repository.save(program);
    }

    public List<Program> getAllProgramsRaw() {
        return repository.findAll();
    }

    public Program getProgramByIdRaw(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Programme introuvable avec l'id : " + id));
    }

    private ProgramStatus parseStatusSafely(String status) {
        if (status == null || status.isBlank()) return null;

        try {
            return ProgramStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null; // Statut invalide => on ignore
        }
    }

    public List<Program> searchProgramsRaw(String name, String status, String sort,
                                           LocalDate startDate, LocalDate endDate) {
        final ProgramStatus parsedStatus = parseStatusSafely(status);

        return repository.findAll().stream()
                .filter(p -> name == null || p.getName().toLowerCase().startsWith(name.toLowerCase()))
                .filter(p -> parsedStatus == null || p.getStatus() == parsedStatus)
                .filter(p -> startDate == null || (p.getStartDate() != null && !p.getStartDate().isBefore(startDate)))
                .filter(p -> endDate == null || (p.getEndDate() != null && !p.getEndDate().isAfter(endDate)))
                .sorted((p1, p2) -> {
                    if (p1.getStartDate() == null || p2.getStartDate() == null) return 0;
                    return "desc".equalsIgnoreCase(sort)
                            ? p2.getStartDate().compareTo(p1.getStartDate())
                            : p1.getStartDate().compareTo(p2.getStartDate());
                })
                .toList();
    }

    public void deleteProgramById(Long id) {
        repository.deleteById(id);
    }

    public Program save(Program program) {
        return repository.save(program);
    }

    public Program updateProgram(Long id, String name, String description, LocalDate startDate,
                                 LocalDate endDate, Double budget, MultipartFile logo, User lead,
                                 ProgramStatus status) throws IOException {
        // Retrieve existing program
        Program program = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Programme introuvable avec l'ID : " + id));

        // Update program fields
        program.setName(name);
        program.setDescription(description);
        program.setStartDate(startDate);
        program.setEndDate(endDate);
        program.setBudget(budget);
        program.setProgramLead(lead);
        program.setStatus(status); // Update the status

        // Handle logo update if provided
        if (logo != null && !logo.isEmpty()) {
            // Delete old logo from Cloudinary if it exists
            if (program.getLogoUrl() != null && !program.getLogoUrl().isEmpty()) {
                String publicId = extractPublicIdFromUrl(program.getLogoUrl());
                if (publicId != null) {
                    cloudinaryService.deleteImage(publicId);
                }
            }
            // Upload new logo
            String logoUrl = cloudinaryService.uploadImage(logo); // Directly get the URL as String
            program.setLogoUrl(logoUrl);
        }

        // Save updated program
        return repository.save(program);
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