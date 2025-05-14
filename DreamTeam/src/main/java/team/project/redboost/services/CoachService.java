package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.CoachRepository;
import team.project.redboost.repositories.CoachRequestRepository;

import jakarta.mail.MessagingException;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CoachService {

    @Autowired
    private CoachRequestRepository coachRequestRepository;

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private S3FileStorageService fileStorageService;

    @Autowired
    private EmailService emailService;

    public CoachRequest submitCoachRequest(CoachRequestForm form) {
        CoachData coachData = form.getCoachData();
        if (coachRequestRepository.existsByEmailAndStatus(coachData.getEmail(), RequestStatus.PENDING)) {
            throw new IllegalStateException("A pending coach request already exists for this email.");
        }

        if (form.isBinome() && (coachData.getBinomeEmail() == null || coachData.getBinomeEmail().isEmpty())) {
            throw new IllegalArgumentException("Binome email is required when isBinome is true.");
        }

        CoachRequest request = new CoachRequest();
        populateCoachRequest(request, coachData, form.getCoachFiles());
        request.setBinome(form.isBinome());
        request.setBinomeEmail(coachData.getBinomeEmail());
        request.setIsCertified(coachData.getIsCertified());
        request.setTotalProposedFee(coachData.getTotalProposedFee());

        if (form.isBinome()) {
            String token = UUID.randomUUID().toString();
            request.setBinomeInvitationToken(token);
            try {
                sendBinomeInvitationEmail(coachData.getBinomeEmail(), token);
            } catch (MessagingException | IOException e) {
                throw new RuntimeException("Failed to send binome invitation email", e);
            }
        }

        request.setStatus(RequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());
        return coachRequestRepository.save(request);
    }

    private void sendBinomeInvitationEmail(String binomeEmail, String token) throws MessagingException, IOException {
        String subject = "Invitation to Submit Binome Coach Request";
        String link = "http://localhost:4200/binome-coach-request?token=" + token;
        String body = "You have been invited to submit a coach request as a binome. Click the link to proceed: <a href=\"" + link + "\">Submit Your Request</a>";
        emailService.sendEmail(binomeEmail, subject, body);
    }

    public CoachRequest submitBinomeCoachRequest(String token, CoachRequestForm form) {
        CoachRequest mainRequest = coachRequestRepository.findByBinomeInvitationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (coachRequestRepository.existsByEmailAndStatus(form.getCoachData().getEmail(), RequestStatus.PENDING)) {
            throw new IllegalStateException("A pending coach request already exists for this email.");
        }

        CoachRequest binomeRequest = new CoachRequest();
        populateCoachRequest(binomeRequest, form.getCoachData(), form.getCoachFiles());
        binomeRequest.setBinome(true);
        binomeRequest.setIsCertified(form.getCoachData().getIsCertified());
        binomeRequest.setTotalProposedFee(form.getCoachData().getTotalProposedFee());
        binomeRequest.setRelatedBinomeRequestId(mainRequest.getId());
        binomeRequest.setStatus(RequestStatus.PENDING);
        binomeRequest.setCreatedAt(LocalDateTime.now());

        binomeRequest = coachRequestRepository.save(binomeRequest);

        mainRequest.setRelatedBinomeRequestId(binomeRequest.getId());
        coachRequestRepository.save(mainRequest);

        return binomeRequest;
    }

    private void populateCoachRequest(CoachRequest request, CoachData coachData, CoachFiles files) {
        request.setFirstName(coachData.getFirstName());
        request.setLastName(coachData.getLastName());
        request.setEmail(coachData.getEmail());
        request.setPhoneNumber(coachData.getPhoneNumber());
        request.setYearsOfExperience(coachData.getYearsOfExperience() != null ? coachData.getYearsOfExperience() : 0);
        request.setSkills(coachData.getSkills());
        request.setExpertise(coachData.getExpertise());

        List<CertificationDocument> certDocs = new ArrayList<>();
        if (files.getCertificationFiles() != null) {
            for (MultipartFile file : files.getCertificationFiles()) {
                if (!file.isEmpty()) {
                    CertificationDocument doc = new CertificationDocument();
                    doc.setDocumentUrl(fileStorageService.uploadFile(file));
                    doc.setDocumentName(file.getOriginalFilename());
                    doc.setDocumentType(coachData.getCertificationType());
                    doc.setCoachRequest(request);
                    certDocs.add(doc);
                }
            }
        }
        request.setCertificationDocuments(certDocs);

        if (files.getCvFile() != null && !files.getCvFile().isEmpty()) {
            request.setCvUrl(fileStorageService.uploadFile(files.getCvFile()));
        }
        if (files.getTrainingProgramFile() != null && !files.getTrainingProgramFile().isEmpty()) {
            request.setTrainingProgramUrl(fileStorageService.uploadFile(files.getTrainingProgramFile()));
        }
    }


    @Transactional
    public void approveCoachRequest(Long requestId) {
        CoachRequest request = coachRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Coach request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is already processed.");
        }

        // Check if a Coach already exists for this email to prevent duplicates
        if (coachRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("A coach with this email already exists.");
        }

        // Create Coach entity (inherits from User)
        Coach coach = new Coach();
        coach.setFirstName(request.getFirstName());
        coach.setLastName(request.getLastName());
        coach.setEmail(request.getEmail());
        coach.setPhoneNumber(request.getPhoneNumber());
        coach.setRole(Role.COACH);
        coach.setActive(true);
        coach.setYearsOfExperience(request.getYearsOfExperience());
        coach.setSkills(request.getSkills());
        coach.setExpertise(request.getExpertise());
        coach.setBinome(request.isBinome());
        coach.setBinomeInvitationToken(request.getBinomeInvitationToken());
        coach.setBinomeEmail(request.getBinomeEmail());
        coach.setIsCertified(request.getIsCertified());
        coach.setTotalProposedFee(request.getTotalProposedFee());
        coach.setCvUrl(request.getCvUrl());
        coach.setTrainingProgramUrl(request.getTrainingProgramUrl());

        // Transfer certification documents to Coach
        List<CertificationDocument> certDocs = new ArrayList<>();
        for (CertificationDocument doc : request.getCertificationDocuments()) {
            CertificationDocument newDoc = new CertificationDocument();
            newDoc.setDocumentUrl(doc.getDocumentUrl());
            newDoc.setDocumentName(doc.getDocumentName());
            newDoc.setDocumentType(doc.getDocumentType());
            newDoc.setCoach(coach);
            certDocs.add(newDoc);
        }
        coach.setCertificationDocuments(certDocs);

        // Save the Coach (this also saves the User part due to inheritance)
        coach = coachRepository.save(coach);

        // Handle binome relationship
        if (request.getRelatedBinomeRequestId() != null) {
            CoachRequest binomeRequest = coachRequestRepository.findById(request.getRelatedBinomeRequestId())
                    .orElse(null);
            if (binomeRequest != null && binomeRequest.getStatus() == RequestStatus.APPROVED) {
                Coach binomeCoach = coachRepository.findByEmail(binomeRequest.getEmail())
                        .orElseThrow(() -> new IllegalStateException("Binome coach not found"));
                coach.setRelatedBinomeCoachId(binomeCoach.getId());
                binomeCoach.setRelatedBinomeCoachId(coach.getId());
                coachRepository.save(binomeCoach);
                coachRepository.save(coach); // Update coach with binome ID
            }
        }

        // Update request status
        request.setStatus(RequestStatus.APPROVED);
        coachRequestRepository.save(request);

        // Auto-approve binome request if pending
        if (request.getRelatedBinomeRequestId() != null) {
            CoachRequest binomeRequest = coachRequestRepository.findById(request.getRelatedBinomeRequestId())
                    .orElse(null);
            if (binomeRequest != null && binomeRequest.getStatus() == RequestStatus.PENDING) {
                approveCoachRequest(binomeRequest.getId());
            }
        }

        // Delete the request after approval
        coachRequestRepository.delete(request);
    }



    public void rejectCoachRequest(Long requestId) {
        CoachRequest request = coachRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Coach request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is already processed.");
        }

        request.setStatus(RequestStatus.REJECTED);
        coachRequestRepository.save(request);
    }

    public List<CoachRequest> getAllCoachRequests() {
        return coachRequestRepository.findAll();
    }

    @lombok.Data
    public static class CoachRequestForm {
        private CoachData coachData;
        private CoachFiles coachFiles;
        private boolean isBinome;
    }

    @lombok.Data
    public static class CoachData {
        private String firstName;
        private String lastName;
        private String email;
        private String phoneNumber;
        private Integer yearsOfExperience;
        private String skills;
        private String expertise;
        private String certificationType;
        private String binomeEmail;
        private Boolean isCertified;
        private Double totalProposedFee;
    }

    @lombok.Data
    public static class CoachFiles {
        private MultipartFile cvFile;
        private MultipartFile trainingProgramFile;
        private MultipartFile[] certificationFiles;
    }
}