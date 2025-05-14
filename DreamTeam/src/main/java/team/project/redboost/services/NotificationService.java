package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.config.NotificationWebSocketHandler;

@Service
public class NotificationService {
    @Autowired
    private NotificationWebSocketHandler webSocketHandler;

    public void notifyUser(String userId, String message) {
        try {
            System.out.println("Sending notification at: " + java.time.Instant.now() + " to user: " + userId);
            webSocketHandler.sendNotificationToUser(userId, message);
        } catch (Exception e) {
            System.err.println("Failed to send notification at: " + java.time.Instant.now() + " to user " + userId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}