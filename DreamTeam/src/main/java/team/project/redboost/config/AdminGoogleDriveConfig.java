package team.project.redboost.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext; // Import ApplicationContext
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource; // Import Resource
// import org.springframework.util.ResourceUtils; // No longer directly needed for loading stream

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Configuration
public class AdminGoogleDriveConfig {

    private static final Logger logger = LoggerFactory.getLogger(AdminGoogleDriveConfig.class);

    @Value("${spring.application.name:RedboostApp}")
    private String applicationName;

    @Value("${google.drive.admin.credentials.path:classpath:/admin-redboost-credentials.json}")
    private String adminCredentialsPath;

    @Autowired // Inject the ApplicationContext
    private ApplicationContext applicationContext;

    /**
     * Helper method to build a Google Drive service instance from credentials.
     * (Keep this method as is)
     */
    private Drive buildDriveService(InputStream credentialsStream, String applicationName)
            throws IOException, GeneralSecurityException {
        try {
            GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                    .createScoped(Collections.singleton(DriveScopes.DRIVE));

            NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

            return new Drive.Builder(
                    httpTransport,
                    JacksonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName(applicationName)
                    .build();
        } finally {
            // Ensure the InputStream is closed (although the client builder might consume it immediately)
            if (credentialsStream != null) {
                try {
                    credentialsStream.close();
                } catch (IOException e) {
                    logger.warn("Failed to close credentials stream: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * Helper method to load credentials from a given path using Spring's ApplicationContext.
     * Supports classpath: and file: prefixes via the ApplicationContext's ResourceLoader.
     */
    private InputStream loadCredentials(String path) throws IOException {
        logger.info("Attempting to load admin credentials from path: {}", path);
        if (path == null || path.isEmpty()) {
            throw new IllegalArgumentException("Admin credentials path is not configured.");
        }
        try {
            // Use Spring's ApplicationContext to get the resource
            Resource resource = applicationContext.getResource(path);

            if (!resource.exists()) {
                // Explicit check and tailored exception
                throw new FileNotFoundException("Admin Credentials file not found at: " + path);
            }

            // Get the InputStream from the Resource
            InputStream stream = resource.getInputStream();
            logger.info("Successfully loaded InputStream for path: {}", path);
            return stream;

        } catch (FileNotFoundException e) {
            logger.error("Admin Credentials file NOT found at: {}", path, e);
            // Re-throw or wrap the exception appropriately
            throw new IOException("Admin Credentials file not found at: " + path, e);
        } catch (IOException e) {
            logger.error("Failed to read Admin credentials file from path: {}", path, e);
            throw new IOException("Failed to read Admin credentials file from path: " + path, e);
        }
        // Note: Closing the stream is typically handled by the consumer (buildDriveService),
        // or by the finally block if an exception occurs during stream creation itself.
    }

    /**
     * Provides the Google Drive service instance for ADMIN operations.
     * This bean is qualified so it can be injected specifically.
     */
    @Bean
    @Qualifier("adminDriveService") // Qualifier for the admin Drive instance
    public Drive adminDriveService() throws IOException, GeneralSecurityException {
        logger.info("Initializing Google Drive service for ADMIN operations...");
        InputStream credentialsStream = loadCredentials(adminCredentialsPath);
        // applicationName includes '-Admin' suffix from property binding, keep as is or adjust
        return buildDriveService(credentialsStream, applicationName + "-Admin");
    }
}