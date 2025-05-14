package team.project.redboost.controllers;

import team.project.redboost.entities.GuideLanding;
import team.project.redboost.services.GuideLandingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/guides")
public class GuideLandingController {

    @Autowired
    private GuideLandingService guideService;

    @GetMapping
    public List<GuideLanding> getAllGuides() {
        return guideService.getAllGuides();
    }

    @GetMapping("/{id}")
    public ResponseEntity<GuideLanding> getGuideById(@PathVariable Long id) {
        Optional<GuideLanding> guide = guideService.getGuideById(id);
        return guide.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public List<GuideLanding> getGuidesByCategory(@PathVariable Long categoryId) {
        return guideService.getGuidesByCategory(categoryId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GuideLanding> createGuide(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("file") MultipartFile file,
            @RequestParam("categoryId") Long categoryId
    ) throws IOException {
        GuideLanding guide = guideService.createGuide(title, description, file, categoryId);
        return ResponseEntity.ok(guide);
    }


    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GuideLanding> updateGuide(
            @PathVariable Long id,
            @RequestPart(value = "guide", required = false) GuideLanding guide,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {
        Long categoryId = (guide != null && guide.getCategory() != null) ? guide.getCategory().getId() : null;
        String title = guide != null ? guide.getTitle() : null;
        String description = guide != null ? guide.getDescription() : null;
        Optional<GuideLanding> updatedGuide = guideService.updateGuide(id, title, description, file, categoryId);
        return updatedGuide.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGuide(@PathVariable Long id) {
        boolean deleted = guideService.deleteGuide(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        Optional<GuideLanding> guideOptional = guideService.getGuideById(id);
        if (!guideOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        GuideLanding guide = guideOptional.get();
        File file = new File(guide.getFile());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .body(resource);
    }
}