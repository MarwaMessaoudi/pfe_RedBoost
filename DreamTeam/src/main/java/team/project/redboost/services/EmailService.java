package team.project.redboost.services;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Properties;

@Service
public class EmailService {

    private static final String USER_EMAIL = "messaoudimarwa75@gmail.com";
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final Gmail gmail;
    private final Credential credential;

    @Autowired
    public EmailService(Gmail gmail, Credential credential) {
        this.gmail = gmail;
        this.credential = credential;
    }

    /**
     * Sends an email via Gmail API with proactive token refresh
     */
    public void sendEmail(String to, String subject, String body) throws MessagingException, IOException {
        ensureValidCredential(); // Proactively refresh token
        try {
            MimeMessage mimeMessage = createEmail(to, USER_EMAIL, subject, body);
            Message message = createMessageWithEmail(mimeMessage);
            gmail.users().messages().send(USER_EMAIL, message).execute();
            logger.info("Email sent successfully to {}", to);
        } catch (IOException e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
            if (e.getMessage().contains("invalid_grant")) {
                logger.error("Refresh token is invalid or revoked. Re-authentication required.");
                throw new IOException("Invalid refresh token. Please re-authenticate via OAuth2.", e);
            }
            // Retry once for transient errors
            ensureValidCredential();
            MimeMessage mimeMessage = createEmail(to, USER_EMAIL, subject, body);
            Message message = createMessageWithEmail(mimeMessage);
            gmail.users().messages().send(USER_EMAIL, message).execute();
            logger.info("Email sent successfully to {} after retry", to);
        }
    }

    /**
     * Ensures the credential is valid, refreshing it proactively if nearing expiry
     */
    private void ensureValidCredential() throws IOException {
        synchronized (credential) { // Thread-safe refresh
            if (credential.getExpiresInSeconds() == null || credential.getExpiresInSeconds() <= 60) {
                logger.info("Access token nearing expiry ({} seconds remaining), refreshing proactively.",
                        credential.getExpiresInSeconds());
                if (!credential.refreshToken()) {
                    logger.error("Failed to refresh token. Check refresh token validity in application.properties.");
                    throw new IOException("Unable to refresh token.");
                }
                logger.info("Token refreshed successfully.");
            }
        }
    }

    /**
     * Creates a formatted MIME email
     */
    private MimeMessage createEmail(String to, String from, String subject, String bodyText) throws MessagingException {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);
        MimeMessage email = new MimeMessage(session);
        email.setFrom(new InternetAddress(from));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        email.setSubject(subject);
        email.setText(bodyText);
        return email;
    }

    /**
     * Encodes a MIME email in base64 for Gmail API
     */
    private Message createMessageWithEmail(MimeMessage email) throws MessagingException, IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        email.writeTo(buffer);
        byte[] bytes = buffer.toByteArray();
        String encodedEmail = java.util.Base64.getUrlEncoder().encodeToString(bytes);
        Message message = new Message();
        message.setRaw(encodedEmail);
        return message;
    }
}