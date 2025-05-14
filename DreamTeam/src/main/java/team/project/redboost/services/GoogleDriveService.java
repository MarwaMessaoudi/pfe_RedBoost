package team.project.redboost.services;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.api.services.drive.model.Permission;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.*;

@Service
public class GoogleDriveService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleDriveService.class);

    @Value("${spring.application.name:RedboostApp}")
    private String applicationName;

    @Value("${google.drive.credentials.path:/redboost-credentials.json}")
    private String credentialsPath;

    private Drive driveService;

    /**
     * Initializes the Google Drive service after bean creation.
     * Uses @PostConstruct to ensure proper initialization after dependency injection.
     */
    @PostConstruct
    public void init() {
        try {
            initializeDriveService();
            logger.info("Google Drive service initialized successfully.");
        } catch (IOException | GeneralSecurityException e) {
            logger.error("Failed to initialize Google Drive service: {}", e.getMessage(), e);
            throw new RuntimeException("Unable to initialize Google Drive service", e);
        }
    }

    /**
     * Initializes the Google Drive service with service account credentials.
     * Loads credentials from the classpath or file system based on the credentialsPath.
     */
    private void initializeDriveService() throws IOException, GeneralSecurityException {
        if (credentialsPath == null || credentialsPath.isEmpty()) {
            throw new IllegalArgumentException(
                    "Google Drive credentials path is not configured. " +
                            "Please set 'google.drive.credentials.path' in application.properties."
            );
        }

        InputStream credentialsStream;
        if (credentialsPath.startsWith("/")) {
            // Load from classpath (e.g., src/main/resources)
            credentialsStream = getClass().getResourceAsStream(credentialsPath);
        } else {
            // Load from file system (e.g., for production)
            credentialsStream = new java.io.FileInputStream(credentialsPath);
        }

        if (credentialsStream == null) {
            throw new IOException("Credentials file not found at: " + credentialsPath);
        }

        try {
            GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                    .createScoped(Collections.singleton(DriveScopes.DRIVE));

            NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

            driveService = new Drive.Builder(
                    httpTransport,
                    JacksonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName(applicationName)
                    .build();
        } finally {
            // Ensure the InputStream is closed to prevent resource leaks
            try {
                credentialsStream.close();
            } catch (IOException e) {
                logger.warn("Failed to close credentials stream: {}", e.getMessage());
            }
        }
    }

    /**
     * Creates a folder in the platform's Google Drive.
     * @param folderName The name of the folder to create.
     * @return The ID of the created folder.
     * @throws IOException If an API or network error occurs.
     */
    public String createFolder(String folderName) throws IOException {
        if (folderName == null || folderName.trim().isEmpty()) {
            throw new IllegalArgumentException("Folder name cannot be null or empty.");
        }

        logger.info("Creating folder '{}'", folderName);

        File folderMetadata = new File()
                .setName(folderName)
                .setMimeType("application/vnd.google-apps.folder");

        File folder = driveService.files().create(folderMetadata)
                .setFields("id")
                .execute();

        logger.info("Folder '{}' created with ID {}", folderName, folder.getId());
        return folder.getId();
    }

    /**
     * Shares a folder with a user by email.
     * @param folderId The ID of the folder to share.
     * @param email The email address of the user to share with.
     * @param role The role to assign (e.g., "writer" or "reader").
     * @throws IOException If an API or network error occurs.
     */
    public void shareFolder(String folderId, String email, String role) throws IOException {
        if (folderId == null || email == null || role == null) {
            throw new IllegalArgumentException("Folder ID, email, and role cannot be null.");
        }

        logger.info("Sharing folder '{}' with email '{}' as '{}'", folderId, email, role);

        Permission permission = new Permission()
                .setType("user")
                .setRole(role)
                .setEmailAddress(email);

        driveService.permissions().create(folderId, permission)
                .setFields("id")
                .execute();

        logger.info("Folder '{}' shared with '{}'", folderId, email);
    }

    /**
     * Removes a user's permission from a folder.
     * @param folderId The ID of the folder.
     * @param permissionId The ID of the permission to remove.
     * @throws IOException If an API or network error occurs.
     */
    public void removePermission(String folderId, String permissionId) throws IOException {
        if (folderId == null || permissionId == null) {
            throw new IllegalArgumentException("Folder ID and permission ID cannot be null.");
        }

        logger.info("Removing permission '{}' from folder '{}'", permissionId, folderId);
        driveService.permissions().delete(folderId, permissionId).execute();
        logger.info("Permission '{}' removed from folder '{}'", permissionId, folderId);
    }

    /**
     * Retrieves the list of permissions for a folder.
     * @param folderId The ID of the folder.
     * @return A list of permissions.
     * @throws IOException If an API or network error occurs.
     */
    public List<Permission> getFolderPermissions(String folderId) throws IOException {
        if (folderId == null) {
            throw new IllegalArgumentException("Folder ID cannot be null.");
        }

        logger.info("Retrieving permissions for folder '{}'", folderId);
        List<Permission> permissions = driveService.permissions().list(folderId)
                .setFields("permissions(id,emailAddress,role)")
                .execute()
                .getPermissions();

        logger.info("Retrieved {} permissions for folder '{}'", permissions.size(), folderId);
        return permissions;
    }

    /**
     * Creates a subfolder in a parent folder.
     * @param subFolderName The name of the subfolder.
     * @param parentFolderId The ID of the parent folder.
     * @return The ID of the created subfolder.
     * @throws IOException If an API or network error occurs.
     */
    public String createSubFolder(String subFolderName, String parentFolderId) throws IOException {
        if (subFolderName == null || subFolderName.trim().isEmpty() || parentFolderId == null) {
            throw new IllegalArgumentException("Subfolder name and parent folder ID cannot be null or empty.");
        }

        logger.info("Creating subfolder '{}' in parent '{}'", subFolderName, parentFolderId);

        File folderMetadata = new File()
                .setName(subFolderName)
                .setMimeType("application/vnd.google-apps.folder")
                .setParents(Collections.singletonList(parentFolderId));

        File subFolder = driveService.files().create(folderMetadata)
                .setFields("id")
                .execute();

        logger.info("Subfolder '{}' created with ID {}", subFolderName, subFolder.getId());
        return subFolder.getId();
    }

    /**
     * Uploads a file to a specified folder.
     * @param folderId The ID of the parent folder.
     * @param fileName The name of the file.
     * @param fileContent The file content as an InputStream.
     * @param mimeType The MIME type of the file (e.g., "application/pdf").
     * @return The ID of the uploaded file.
     * @throws IOException If an API or network error occurs.
     */
    public String uploadFile(String folderId, String fileName, InputStream fileContent, String mimeType) throws IOException {
        if (folderId == null || fileName == null || fileContent == null || mimeType == null) {
            throw new IllegalArgumentException("Folder ID, file name, file content, and MIME type cannot be null.");
        }

        logger.info("Uploading file '{}' to folder '{}'", fileName, folderId);

        File fileMetadata = new File()
                .setName(fileName)
                .setParents(Collections.singletonList(folderId));

        InputStreamContent mediaContent = new InputStreamContent(mimeType, fileContent);

        File file = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id")
                .execute();

        logger.info("File '{}' uploaded with ID {}", fileName, file.getId());
        return file.getId();
    }

    /**
     * Retrieves the list of subfolders in a parent folder.
     * @param parentFolderId The ID of the parent folder.
     * @return A list of subfolder metadata (id, name, mimeType).
     * @throws IOException If an API or network error occurs.
     */
    public List<Map<String, String>> getSubFoldersList(String parentFolderId) throws IOException {
        if (parentFolderId == null) {
            throw new IllegalArgumentException("Parent folder ID cannot be null.");
        }

        logger.info("Retrieving subfolders for parent '{}'", parentFolderId);

        String query = String.format(
                "mimeType = 'application/vnd.google-apps.folder' and '%s' in parents and trashed = false",
                parentFolderId
        );

        FileList result = driveService.files().list()
                .setQ(query)
                .setOrderBy("name")
                .setFields("files(id, name, mimeType)")
                .execute();

        List<Map<String, String>> items = new ArrayList<>();
        if (result.getFiles() != null) {
            for (File file : result.getFiles()) {
                Map<String, String> itemInfo = new HashMap<>();
                itemInfo.put("id", file.getId());
                itemInfo.put("name", file.getName());
                itemInfo.put("mimeType", file.getMimeType());
                items.add(itemInfo);
            }
        }

        logger.info("Found {} subfolders for parent '{}'", items.size(), parentFolderId);
        return items;
    }

    /**
     * Retrieves the list of files in a folder.
     * @param folderId The ID of the folder.
     * @return A list of file metadata (id, name, mimeType).
     * @throws IOException If an API or network error occurs.
     */
    public List<Map<String, String>> getFilesList(String folderId) throws IOException {
        if (folderId == null) {
            throw new IllegalArgumentException("Folder ID cannot be null.");
        }

        logger.info("Retrieving files for folder '{}'", folderId);

        String query = String.format(
                "mimeType != 'application/vnd.google-apps.folder' and '%s' in parents and trashed = false",
                folderId
        );

        FileList result = driveService.files().list()
                .setQ(query)
                .setOrderBy("name")
                .setFields("files(id, name, mimeType)")
                .execute();

        List<Map<String, String>> items = new ArrayList<>();
        if (result.getFiles() != null) {
            for (File file : result.getFiles()) {
                Map<String, String> itemInfo = new HashMap<>();
                itemInfo.put("id", file.getId());
                itemInfo.put("name", file.getName());
                itemInfo.put("mimeType", file.getMimeType());
                items.add(itemInfo);
            }
        }

        logger.info("Found {} files for folder '{}'", items.size(), folderId);
        return items;
    }

    public InputStream downloadFile(String fileId) throws IOException {
        if (fileId == null) {
            throw new IllegalArgumentException("File ID cannot be null.");
        }

        logger.info("Downloading file '{}'", fileId);
        return driveService.files().get(fileId).executeMediaAsInputStream();
    }

    /**
     * Retrieves the name of a file by its file ID.
     * @param fileId The ID of the file.
     * @return The name of the file.
     * @throws IOException If an API or network error occurs.
     */
    public String getFileName(String fileId) throws IOException {
        if (fileId == null) {
            throw new IllegalArgumentException("File ID cannot be null.");
        }

        logger.info("Retrieving file name for '{}'", fileId);
        File file = driveService.files().get(fileId).setFields("name").execute();
        return file.getName();
    }

}