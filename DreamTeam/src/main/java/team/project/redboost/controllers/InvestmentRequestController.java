package team.project.redboost.controllers;

import org.springframework.http.ResponseEntity;
import team.project.redboost.entities.InvestmentRequest;
import team.project.redboost.services.InvestmentRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investment-requests")
public class InvestmentRequestController {

    @Autowired
    private InvestmentRequestService investmentRequestService;

    @PostMapping
    public InvestmentRequest createRequest(@RequestBody InvestmentRequest request) {
        return investmentRequestService.createRequest(request);
    }

    @GetMapping
    public List<InvestmentRequest> getAllRequests() {
        List<InvestmentRequest> requests = investmentRequestService.getAllRequests();
        System.out.println("Requests: " + requests);
        return requests;
    }

    @GetMapping("/investor/{investorId}")
    public List<InvestmentRequest> getRequestsByInvestor(@PathVariable Long investorId) {
        return investmentRequestService.getRequestsByInvestor(investorId);
    }

    @GetMapping("/projet/{projetId}")
    public List<InvestmentRequest> getRequestsByProjet(@PathVariable Long projetId) {
        return investmentRequestService.getRequestsByProjet(projetId);
    }

    @GetMapping("/my-startups")
    public List<InvestmentRequest> getRequestsForUserStartups() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return investmentRequestService.getRequestsForUserStartups(username);
    }

    @PutMapping("/{requestId}/status")
    public InvestmentRequest updateStatus(@PathVariable Long requestId, @RequestParam String status) {
        return investmentRequestService.updateRequestStatus(requestId, status);
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<String> deleteInvestmentRequest(@PathVariable Long requestId) {
        boolean deleted = investmentRequestService.deleteRequest(requestId);
        if (deleted) {
            return ResponseEntity.ok("Investment request deleted successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to delete request.");
        }
    }
}