package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.CategorieLanding;
import team.project.redboost.entities.GuideLanding;
import team.project.redboost.repositories.CategorieLandingRepo;
import team.project.redboost.repositories.GuideLandingRepo;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class GuideLandingService {

    @Autowired
    private GuideLandingRepo guideRepository;

    @Autowired
    private CategorieLandingRepo categoryRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public List<GuideLanding> getAllGuides() {
        return guideRepository.findAll();
    }

    public Optional<GuideLanding>getGuideById(Long id) {
        return guideRepository.findById(id);
    }

    public List<GuideLanding>getGuidesByCategory(Long categoryId) {
        return guideRepository.findByCategoryId(categoryId);
    }

    public GuideLanding createGuide(String title, String description, MultipartFile file, Long categoryId) throws IOException {
        // Validate category
        Optional<CategorieLanding> categoryOptional = categoryRepository.findById(categoryId);
        if (!categoryOptional.isPresent()) {
            throw new IllegalArgumentException("Category not found");
        }

        // Handle file upload
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
        }
        File destFile = new File(uploadDirFile, fileName);
        file.transferTo(destFile);

        // Create guide
        GuideLanding guide = new GuideLanding();
        guide.setTitle(title);
        guide.setDescription(description);
        guide.setFile(destFile.getPath());
        guide.setCategory(categoryOptional.get());
        return guideRepository.save(guide);
    }

    public Optional<GuideLanding> updateGuide(Long id, String title, String description, MultipartFile file, Long categoryId) throws IOException {
        Optional<GuideLanding> guideOptional = guideRepository.findById(id);
        if (!guideOptional.isPresent()) {
            return Optional.empty();
        }

        GuideLanding guide = guideOptional.get();

        // Update category if provided
        if (categoryId != null) {
            Optional<CategorieLanding> categoryOptional = categoryRepository.findById(categoryId);
            if (!categoryOptional.isPresent()) {
                throw new IllegalArgumentException("Category not found");
            }
            guide.setCategory(categoryOptional.get());
        }

        // Update file if provided
        if (file != null && !file.isEmpty()) {
            // Delete old file
            File oldFile = new File(guide.getFile());
            if (oldFile.exists()) {
                oldFile.delete();
            }

            // Upload new file
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            File uploadDirFile = new File(uploadDir);
            if (!uploadDirFile.exists()) {
                uploadDirFile.mkdirs();
            }
            File destFile = new File(uploadDirFile, fileName);
            file.transferTo(destFile);
            guide.setFile(destFile.getPath());
        }

        // Update other fields
        if (title != null) guide.setTitle(title);
        if (description != null) guide.setDescription(description);

        return Optional.of(guideRepository.save(guide));
    }

    public boolean deleteGuide(Long id) {
        Optional<GuideLanding> guideOptional = guideRepository.findById(id);
        if (guideOptional.isPresent()) {
            GuideLanding guide = guideOptional.get();
            // Delete the associated file
            File file = new File(guide.getFile());
            if (file.exists()) {
                file.delete();
            }
            guideRepository.deleteById(id);
            return true;
        }
        return false;
    }
}