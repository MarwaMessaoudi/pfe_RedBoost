package team.project.redboost.services;

import team.project.redboost.entities.InvestmentRequest;
import team.project.redboost.entities.InvestmentStatus;
import team.project.redboost.entities.Projet;
import team.project.redboost.repositories.InvestmentRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InvestmentRequestService {

    @Autowired
    private InvestmentRequestRepository investmentRequestRepository;

    public InvestmentRequest createRequest(InvestmentRequest request) {
        return investmentRequestRepository.save(request);
    }

    public List<InvestmentRequest> getAllRequests() {
        return investmentRequestRepository.findAll();
    }

    public List<InvestmentRequest> getRequestsByInvestor(Long investorId) {
        return investmentRequestRepository.findByInvestorId(investorId);
    }

    public List<InvestmentRequest> getRequestsByProjet(Long projetId) {
        return investmentRequestRepository.findByProjetId(projetId);
    }

    public List<InvestmentRequest> getRequestsForUserStartups(String username) {
        // Fetch all investment requests where the projet's entrepreneurs include the user with the given username (email)
        List<InvestmentRequest> allRequests = investmentRequestRepository.findAll();

        // Filter requests where the projet has the user as an entrepreneur
        List<InvestmentRequest> userRequests = allRequests.stream()
                .filter(request -> {
                    Projet projet = request.getProjet();
                    if (projet == null || projet.getEntrepreneurs() == null) {
                        return false;
                    }
                    return projet.getEntrepreneurs().stream()
                            .anyMatch(entrepreneur -> entrepreneur.getEmail().equals(username));
                })
                .collect(Collectors.toList());

        // If no matching requests are found, return an empty list
        return userRequests.isEmpty() ? List.of() : userRequests;
    }

    public boolean deleteRequest(Long requestId) {
        if (investmentRequestRepository.existsById(requestId)) {
            investmentRequestRepository.deleteById(requestId);
            return true;
        }
        return false;
    }

    public InvestmentRequest updateRequestStatus(Long requestId, String status) {
        Optional<InvestmentRequest> request = investmentRequestRepository.findById(requestId);
        if (request.isPresent()) {
            InvestmentRequest updatedRequest = request.get();
            try {
                updatedRequest.setStatus(InvestmentStatus.valueOf(status.toUpperCase()));
                return investmentRequestRepository.save(updatedRequest);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value", e);
            }
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Investment Request not found");
        }
    }
}