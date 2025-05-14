package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.services.GoogleDriveService;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for managing Google Drive operations such as creating folders,
 * uploading files, and retrieving folder/file metadata.
 */
@RestController
@RequestMapping("/api/drive")
public class GoogleDriveController {

    private final GoogleDriveService googleDriveService;

    @Autowired
    public GoogleDriveController(GoogleDriveService googleDriveService) {
        this.googleDriveService = googleDriveService;
    }

    /**
     * Creates a new folder in Google Drive.
     * @param folderName The name of the folder to create.
     * @return The ID of the created folder.
     * @throws IOException If an API or network error occurs.
     */
    @PostMapping("/create-folder")
    public ResponseEntity<String> createFolder(@RequestParam("folderName") String folderName) throws IOException {
        try {
            String folderId = googleDriveService.createFolder(folderName);
            return ResponseEntity.ok(folderId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create folder: " + e.getMessage());
        }
    }

    /**
     * Creates a subfolder in a specified parent folder.
     * @param parentFolderId The ID of the parent folder.
     * @param subFolderName The name of the subfolder to create.
     * @return The ID of the created subfolder.
     * @throws IOException If an API or network error occurs.
     */
    @PostMapping("/create-subfolder")
    public ResponseEntity<String> createSubFolder(
            @RequestParam("parentFolderId") String parentFolderId,
            @RequestParam("subFolderName") String subFolderName) throws IOException {
        try {
            String subFolderId = googleDriveService.createSubFolder(subFolderName, parentFolderId);
            return ResponseEntity.ok(subFolderId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create subfolder: " + e.getMessage());
        }
    }

    /**
     * Uploads a file to a specified folder in Google Drive.
     * @param folderId The ID of the parent folder.
     * @param file The file to upload.
     * @param mimeType The MIME type of the file (optional, defaults to file's content type).
     * @return The ID of the uploaded file.
     * @throws IOException If an API or network error occurs.
     */
    @PostMapping("/upload-file")
    public ResponseEntity<String> uploadFile(
            @RequestParam("folderId") String folderId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mimeType", required = false) String mimeType) throws IOException {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("File cannot be empty.");
            }
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed_file";
            // Use provided MIME type or fallback to file's content type
            String effectiveMimeType = mimeType != null ? mimeType : file.getContentType();
            if (effectiveMimeType == null) {
                effectiveMimeType = "application/octet-stream"; // Fallback for unknown types
            }
            String fileId = googleDriveService.uploadFile(folderId, fileName, file.getInputStream(), effectiveMimeType);
            return ResponseEntity.ok(fileId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Retrieves the list of subfolders in a parent folder.
     * @param parentFolderId The ID of the parent folder.
     * @return A list of subfolder metadata (id, name, mimeType).
     * @throws IOException If an API or network error occurs.
     */
    @GetMapping("/subfolders")
    public ResponseEntity<List<Map<String, String>>> getSubFolders(@RequestParam("parentFolderId") String parentFolderId) throws IOException {
        try {
            List<Map<String, String>> subFolders = googleDriveService.getSubFoldersList(parentFolderId);
            return ResponseEntity.ok(subFolders);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Retrieves the list of files in a folder.
     * @param folderId The ID of the folder.
     * @return A list of file metadata (id, name, mimeType).
     * @throws IOException If an API or network error occurs.
     */
    @GetMapping("/files")
    public ResponseEntity<List<Map<String, String>>> getFiles(@RequestParam("folderId") String folderId) throws IOException {
        try {
            List<Map<String, String>> files = googleDriveService.getFilesList(folderId);
            return ResponseEntity.ok(files);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Retrieves the permissions for a folder.
     * @param folderId The ID of the folder.
     * @return A list of permission metadata (id, email, role).
     * @throws IOException If an API or network error occurs.
     */
    @GetMapping("/permissions")
    public ResponseEntity<List<Map<String, String>>> getFolderPermissions(@RequestParam("folderId") String folderId) throws IOException {
        try {
            List<Map<String, String>> permissions = googleDriveService.getFolderPermissions(folderId).stream()
                    .map(permission -> Map.of(
                            "id", permission.getId(),
                            "email", permission.getEmailAddress() != null ? permission.getEmailAddress() : "",
                            "role", permission.getRole() != null ? permission.getRole() : ""))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(permissions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Shares a folder with a user by email.
     * @param folderId The ID of the folder to share.
     * @param email The email address of the user to share with.
     * @param role The role to assign (e.g., "writer" or "reader").
     * @return A success message.
     * @throws IOException If an API or network error occurs.
     */
    @PostMapping("/share-folder")
    public ResponseEntity<String> shareFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("email") String email,
            @RequestParam("role") String role) throws IOException {
        try {
            googleDriveService.shareFolder(folderId, email, role);
            return ResponseEntity.ok("Folder shared successfully with " + email);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to share folder: " + e.getMessage());
        }
    }

    /**
     * Removes a permission from a folder.
     * @param folderId The ID of the folder.
     * @param permissionId The ID of the permission to remove.
     * @return A success message.
     * @throws IOException If an API or network error occurs.
     */
    @DeleteMapping("/permissions")
    public ResponseEntity<String> removePermission(
            @RequestParam("folderId") String folderId,
            @RequestParam("permissionId") String permissionId) throws IOException {
        try {
            googleDriveService.removePermission(folderId, permissionId);
            return ResponseEntity.ok("Permission removed successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to remove permission: " + e.getMessage());
        }
    }


    @GetMapping("/files/{fileId}/name")
    public ResponseEntity<Map<String, String>> getFileName(@PathVariable String fileId) throws IOException {
        try {
            String fileName = googleDriveService.getFileName(fileId);
            return ResponseEntity.ok(Map.of("name", fileName));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid input: " + e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve file name: " + e.getMessage()));
        }
    }
}