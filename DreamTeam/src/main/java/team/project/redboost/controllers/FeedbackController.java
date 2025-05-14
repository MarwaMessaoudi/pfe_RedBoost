package team.project.redboost.controllers;

import team.project.redboost.entities.User;
import team.project.redboost.services.FeedbackService;
import team.project.redboost.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> submitFeedback(
            @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        if (user == null) {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé");
        }

        feedbackService.saveFeedback(request.getRating(), user);
        return ResponseEntity.ok().body(Map.of("message", "Merci pour votre feedback !"));
    }

    // Add this DTO class
    // Static inner class
    public static class FeedbackRequest {
        private int rating;

        public int getRating() {
            return rating;
        }

        public void setRating(int rating) {
            this.rating = rating;
        }
    }
}