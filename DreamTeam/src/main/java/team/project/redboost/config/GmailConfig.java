package team.project.redboost.config;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Configuration
public class GmailConfig {

    private static final String APPLICATION_NAME = "Redboost";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private static final String TOKENS_DIRECTORY_PATH = "tokens";
    private static final String CLIENT_ID = "717073407944-pmbmhmhpdg3jove9da1582o9ihl2itat.apps.googleusercontent.com";
    private static final String CLIENT_SECRET = "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";
    private static final Logger logger = LoggerFactory.getLogger(GmailConfig.class);

    @Value("${gmail.refresh-token}")
    private String refreshToken;

    @Bean
    public Credential credential() throws IOException, GeneralSecurityException {
        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        Credential credential = getCredentials(HTTP_TRANSPORT);
        return credential;
    }

    @Bean
    public Gmail gmailService(Credential credential) throws IOException, GeneralSecurityException {
        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        return new Gmail.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    private Credential getCredentials(final NetHttpTransport HTTP_TRANSPORT) throws IOException {
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new IllegalStateException("gmail.refresh-token is not set in application.properties");
        }

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                JSON_FACTORY,
                new StringReader("{\"installed\":{\"client_id\":\"" + CLIENT_ID + "\",\"client_secret\":\"" + CLIENT_SECRET + "\"}}")
        );

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets,
                Collections.singletonList(GmailScopes.GMAIL_SEND))
                .setDataStoreFactory(new FileDataStoreFactory(new File(TOKENS_DIRECTORY_PATH)))
                .setAccessType("offline")
                .build();

        GoogleTokenResponse tokenResponse = new GoogleTokenResponse().setRefreshToken(refreshToken);
        Credential credential = flow.createAndStoreCredential(tokenResponse, "user");
        refreshCredentialIfNeeded(credential); // Initial refresh check
        return credential;
    }

    private void refreshCredentialIfNeeded(Credential credential) throws IOException {
        synchronized (credential) { // Thread-safe refresh
            if (credential.getExpiresInSeconds() == null || credential.getExpiresInSeconds() <= 60) {
                logger.info("Initial access token expired or unavailable, refreshing proactively.");
                if (!credential.refreshToken()) {
                    logger.error("Failed to refresh token during initialization. Check refresh token validity.");
                    throw new IOException("Unable to refresh token during initialization.");
                }
                logger.info("Token refreshed successfully during initialization.");
            }
        }
    }
}