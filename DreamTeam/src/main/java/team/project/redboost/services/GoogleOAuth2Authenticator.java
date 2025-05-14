package team.project.redboost.services;

import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

@Component
public class GoogleOAuth2Authenticator {

    private static final String SCOPE = "https://www.googleapis.com/auth/gmail.send";

    public GoogleCredentials getCredentials() throws IOException {
        // Load the credentials from the JSON file in the classpath
        InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("credentials.json");

        // Create the credentials object from the input stream and apply the required scope
        GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount)
                .createScoped(Collections.singleton(SCOPE));

        // Refresh the token if it is null or expired
        if (credentials.getAccessToken() == null) {
            credentials.refresh();
        }

        return credentials;
    }
}
