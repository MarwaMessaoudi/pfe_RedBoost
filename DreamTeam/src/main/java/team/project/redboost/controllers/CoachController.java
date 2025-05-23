package team.project.redboost.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.CoachRequest;
import team.project.redboost.services.CoachService;
import team.project.redboost.services.CoachService.CoachRequestForm;
import team.project.redboost.services.CoachService.CoachData;
import team.project.redboost.services.CoachService.CoachFiles;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach")
public class CoachController {

    @Autowired
    private CoachService coachService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitCoachRequest(
            @RequestPart("formData") String formDataJson,
            @RequestPart(value = "cvFile", required = false) MultipartFile cvFile,
            @RequestPart(value = "trainingProgramFile", required = false) MultipartFile trainingProgramFile,
            @RequestPart(value = "certificationFiles", required = false) MultipartFile[] certificationFiles) {
        try {
            List<Map<String, Object>> formData = objectMapper.readValue(formDataJson, List.class);
            CoachRequestForm form = new CoachRequestForm();
            CoachFiles coachFiles = new CoachFiles();

            for (Map<String, Object> field : formData) {
                String key = (String) field.get("key");
                Object value = field.get("value");
                switch (key) {
                    case "coachData":
                        form.setCoachData(objectMapper.readValue((String) value, CoachData.class));
                        break;
                    case "isBinome":
                        form.setBinome(Boolean.parseBoolean((String) value));
                        break;
                }
            }

            if (form.isBinome() && (form.getCoachData().getBinomeEmail() == null || form.getCoachData().getBinomeEmail().isEmpty())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Binome email is required when isBinome is true",
                        "errorCode", "COACH005"
                ));
            }

            coachFiles.setCvFile(cvFile);
            coachFiles.setTrainingProgramFile(trainingProgramFile);
            coachFiles.setCertificationFiles(certificationFiles);
            form.setCoachFiles(coachFiles);

            CoachRequest request = coachService.submitCoachRequest(form);
            return ResponseEntity.ok(request);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "COACH001"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to submit coach request",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping(value = "/binome", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitBinomeCoachRequest(
            @RequestPart("token") String token,
            @RequestPart("formData") String formDataJson,
            @RequestPart(value = "cvFile", required = false) MultipartFile cvFile,
            @RequestPart(value = "trainingProgramFile", required = false) MultipartFile trainingProgramFile,
            @RequestPart(value = "certificationFiles", required = false) MultipartFile[] certificationFiles) {
        try {
            List<Map<String, Object>> formData = objectMapper.readValue(formDataJson, List.class);
            CoachRequestForm form = new CoachRequestForm();
            CoachFiles coachFiles = new CoachFiles();

            for (Map<String, Object> field : formData) {
                String key = (String) field.get("key");
                Object value = field.get("value");
                switch (key) {
                    case "coachData":
                        form.setCoachData(objectMapper.readValue((String) value, CoachData.class));
                        break;
                    case "isBinome":
                        form.setBinome(Boolean.parseBoolean((String) value));
                        break;
                }
            }

            coachFiles.setCvFile(cvFile);
            coachFiles.setTrainingProgramFile(trainingProgramFile);
            coachFiles.setCertificationFiles(certificationFiles);
            form.setCoachFiles(coachFiles);

            CoachRequest request = coachService.submitBinomeCoachRequest(token, form);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "COACH002"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to submit binome coach request",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/approve/{requestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> approveCoachRequest(@PathVariable Long requestId) {
        try {
            coachService.approveCoachRequest(requestId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "COACH003"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to approve coach request",
                    "error", e.getMessage()
            ));
        }
    }


    @PostMapping("/reject/{requestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> rejectCoachRequest(@PathVariable Long requestId) {
        try {
            coachService.rejectCoachRequest(requestId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "COACH004"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to reject coach request",
                    "error", e.getMessage()
            ));
        }
    }
    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")    public ResponseEntity<List<CoachRequest>> getAllCoachRequests() {
        return ResponseEntity.ok(coachService.getAllCoachRequests());
    }
}