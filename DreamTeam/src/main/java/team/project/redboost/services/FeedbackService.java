package team.project.redboost.services;

import team.project.redboost.entities.Feedback;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.FeedbackRepository;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public Feedback saveFeedback(int rating, User user) {
        Feedback feedback = new Feedback(rating, user);
        return feedbackRepository.save(feedback);
    }
}