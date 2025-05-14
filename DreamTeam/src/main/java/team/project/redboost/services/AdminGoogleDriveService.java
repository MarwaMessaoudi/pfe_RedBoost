package team.project.redboost.services;

import com.google.api.client.http.InputStreamContent;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.api.services.drive.model.Permission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier; // Needed for injection
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service // Make this a Spring service
public class AdminGoogleDriveService { // New service for ADMIN operations

    private static final Logger logger = LoggerFactory.getLogger(AdminGoogleDriveService.class);

    // This field will hold the Drive instance for the ADMIN account
    private final Drive adminDriveService;

    /**
     * Constructor for injecting the specific Admin Drive service instance.
     * Spring finds the bean qualified with "adminDriveService".
     */
    @Autowired
    public AdminGoogleDriveService(@Qualifier("adminDriveService") Drive adminDriveService) {
        this.adminDriveService = adminDriveService;
        logger.info("Admin Google Drive service injected and ready.");
    }

    // --- Implement methods needed for Admin operations using adminDriveService ---
    // Copy/adapt methods from your original GoogleDriveService, changing the 'driveService' field name
    // to 'adminDriveService' where you make the Google API calls.

    /**
     * Creates a folder in the Admin Google Drive.
     * @param folderName The name of the folder to create.
     * @return The ID of the created folder.
     * @throws IOException If an API or network error occurs.
     */
    public String createFolder(String folderName) throws IOException {
        if (folderName == null || folderName.trim().isEmpty()) {
            throw new IllegalArgumentException("Folder name cannot be null or empty.");
        }

        logger.info("ADMIN service: Creating folder '{}'", folderName); // Log distinction

        File folderMetadata = new File()
                .setName(folderName)
                .setMimeType("application/vnd.google-apps.folder");

        // Use the injected adminDriveService instance
        File folder = adminDriveService.files().create(folderMetadata)
                .setFields("id")
                .execute();

        logger.info("ADMIN service: Folder '{}' created with ID {}", folderName, folder.getId());
        return folder.getId();
    }

    /**
     * Creates a subfolder in a specified parent folder within the Admin Drive.
     * @param subFolderName The name of the subfolder.
     * @param parentFolderId The ID of the parent folder in the Admin Drive.
     * @return The ID of the created subfolder.
     * @throws IOException If an API or network error occurs.
     */
    public String createSubFolder(String subFolderName, String parentFolderId) throws IOException {
        if (subFolderName == null || subFolderName.trim().isEmpty() || parentFolderId == null) {
            throw new IllegalArgumentException("Subfolder name and parent folder ID cannot be null or empty.");
        }

        logger.info("ADMIN service: Creating subfolder '{}' in parent '{}'", subFolderName, parentFolderId);

        File folderMetadata = new File()
                .setName(subFolderName)
                .setMimeType("application/vnd.google-apps.folder")
                .setParents(Collections.singletonList(parentFolderId));

        // Use the injected adminDriveService instance
        File subFolder = adminDriveService.files().create(folderMetadata)
                .setFields("id")
                .execute();

        logger.info("ADMIN service: Subfolder '{}' created with ID {}", subFolderName, subFolder.getId());
        return subFolder.getId();
    }

    /**
     * Uploads a file to a specified folder in the Admin Google Drive.
     * @param folderId The ID of the parent folder in the Admin Drive.
     * @param fileName The name of the file.
     * @param fileContent The file content as an InputStream.
     * @param mimeType The MIME type of the file.
     * @return The ID of the uploaded file.
     * @throws IOException If an API or network error occurs.
     */
    public String uploadFile(String folderId, String fileName, InputStream fileContent, String mimeType) throws IOException {
        if (folderId == null || fileName == null || fileContent == null || mimeType == null) {
            throw new IllegalArgumentException("Folder ID, file name, file content, and MIME type cannot be null.");
        }

        logger.info("ADMIN service: Uploading file '{}' to folder '{}'", fileName, folderId);

        File fileMetadata = new File()
                .setName(fileName)
                .setParents(Collections.singletonList(folderId));

        InputStreamContent mediaContent = new InputStreamContent(mimeType, fileContent);

        // Use the injected adminDriveService instance
        File file = adminDriveService.files().create(fileMetadata, mediaContent)
                .setFields("id")
                .execute();

        logger.info("ADMIN service: File '{}' uploaded with ID {}", fileName, file.getId());
        return file.getId();
    }

    /**
     * Retrieves the list of subfolders in a parent folder in the Admin Drive.
     */
    public List<Map<String, String>> getSubFoldersList(String parentFolderId) throws IOException {
        if (parentFolderId == null) {
            throw new IllegalArgumentException("Parent folder ID cannot be null.");
        }

        logger.info("ADMIN service: Retrieving subfolders for parent '{}'", parentFolderId);

        String query = String.format(
                "mimeType = 'application/vnd.google-apps.folder' and '%s' in parents and trashed = false",
                parentFolderId
        );

        // Use the injected adminDriveService instance
        FileList result = adminDriveService.files().list()
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

        logger.info("ADMIN service: Found {} subfolders for parent '{}'", items.size(), parentFolderId);
        return items;
    }

    /**
     * Retrieves the list of files in a folder in the Admin Drive.
     */
    public List<Map<String, String>> getFilesList(String folderId) throws IOException {
        if (folderId == null) {
            throw new IllegalArgumentException("Folder ID cannot be null.");
        }

        logger.info("ADMIN service: Retrieving files for folder '{}'", folderId);

        String query = String.format(
                "mimeType != 'application/vnd.google-apps.folder' and '%s' in parents and trashed = false",
                folderId
        );

        // Use the injected adminDriveService instance
        FileList result = adminDriveService.files().list()
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

        logger.info("ADMIN service: Found {} files for folder '{}'", items.size(), folderId);
        return items;
    }

    // You can add other admin-specific methods here if needed
    // e.g. deleteFile, moveFile etc., remembering to use adminDriveService

    // Add methods for sharing/permissions if admin needs to manage permissions on admin files
    public void shareFolder(String folderId, String email, String role) throws IOException {
        if (folderId == null || email == null || role == null) {
            throw new IllegalArgumentException("Folder ID, email, and role cannot be null.");
        }

        logger.info("ADMIN service: Sharing folder '{}' with email '{}' as '{}'", folderId, email, role);

        Permission permission = new Permission()
                .setType("user")
                .setRole(role)
                .setEmailAddress(email);

        // Use the injected adminDriveService instance
        adminDriveService.permissions().create(folderId, permission)
                .setFields("id")
                .execute();

        logger.info("ADMIN service: Folder '{}' shared with '{}'", folderId, email);
    }

    public List<Permission> getFolderPermissions(String folderId) throws IOException {
        if (folderId == null) {
            throw new IllegalArgumentException("Folder ID cannot be null.");
        }

        logger.info("ADMIN service: Retrieving permissions for folder '{}'", folderId);
        // Use the injected adminDriveService instance
        List<Permission> permissions = adminDriveService.permissions().list(folderId)
                .setFields("permissions(id,emailAddress,role)")
                .execute()
                .getPermissions();

        logger.info("ADMIN service: Retrieved {} permissions for folder '{}'", permissions.size(), folderId);
        return permissions;
    }

    public void removePermission(String folderId, String permissionId) throws IOException {
        if (folderId == null || permissionId == null) {
            throw new IllegalArgumentException("Folder ID and permission ID cannot be null.");
        }

        logger.info("ADMIN service: Removing permission '{}' from folder '{}'", permissionId, folderId);
        // Use the injected adminDriveService instance
        adminDriveService.permissions().delete(folderId, permissionId).execute();
        logger.info("ADMIN service: Permission '{}' removed from folder '{}'", permissionId, folderId);
    }

    public InputStream downloadFile(String fileId) throws IOException {
        if (fileId == null) {
            throw new IllegalArgumentException("File ID cannot be null.");
        }

        logger.info("ADMIN service: Downloading file '{}'", fileId);
        // Use the injected adminDriveService instance
        return adminDriveService.files().get(fileId).executeMediaAsInputStream();
    }

    public String getFileName(String fileId) throws IOException {
        if (fileId == null) {
            throw new IllegalArgumentException("File ID cannot be null.");
        }

        logger.info("ADMIN service: Retrieving file name for '{}'", fileId);
        // Use the injected adminDriveService instance
        File file = adminDriveService.files().get(fileId).setFields("name").execute();
        return file.getName();
    }
}