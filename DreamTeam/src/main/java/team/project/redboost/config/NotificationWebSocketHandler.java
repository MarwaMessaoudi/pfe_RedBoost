package team.project.redboost.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.HashMap;
import java.util.Map;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> userSessions = new HashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        session.sendMessage(new TextMessage("Connected, please send your userId"));
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        if (payload.startsWith("{\"userId\":")) {
            String userId = payload.split("\"")[3]; // Extracts userId from {"userId":"2"}
            session.getAttributes().put("userId", userId);
            userSessions.put(userId, session);
            session.sendMessage(new TextMessage("Connected as " + userId));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            userSessions.remove(userId);
        }
    }

    public void sendNotificationToUser(String userId, String message) throws Exception {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            System.out.println("WebSocket message sent at: " + java.time.Instant.now() + " to user: " + userId + " - Message: " + message);
            session.sendMessage(new TextMessage(message));
        } else {
            System.out.println("No active session for user: " + userId + " at: " + java.time.Instant.now());
        }
    }
}