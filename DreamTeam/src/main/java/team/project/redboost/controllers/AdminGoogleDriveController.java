package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.services.AdminGoogleDriveService; // Import the admin service

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for managing Google Drive operations specific to the Admin Drive.
 */
@RestController
@RequestMapping("/api/admin/drive") // Use a distinct request mapping
public class AdminGoogleDriveController { // New controller for admin endpoints

    private final AdminGoogleDriveService adminDriveService; // Inject the admin service

    @Autowired
    public AdminGoogleDriveController(AdminGoogleDriveService adminDriveService) {
        this.adminDriveService = adminDriveService;
    }

    // --- Add Endpoints for Admin Drive Operations ---
    // Copy/adapt endpoints from your original GoogleDriveController,
    // changing the service calls to use adminDriveService.

    /**
     * Creates a new folder in the Admin Google Drive.
     */
    @PostMapping("/create-folder") // e.g. POST /api/admin/drive/create-folder
    public ResponseEntity<String> createFolder(@RequestParam("folderName") String folderName) throws IOException {
        try {
            // Call the admin service
            String folderId = adminDriveService.createFolder(folderName);
            return ResponseEntity.ok(folderId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create admin folder: " + e.getMessage());
        }
    }

    /**
     * Creates a subfolder in a specified parent folder in the Admin Drive.
     */
    @PostMapping("/create-subfolder")
    public ResponseEntity<String> createSubFolder(
            @RequestParam("parentFolderId") String parentFolderId, // This folderId must exist in the Admin Drive
            @RequestParam("subFolderName") String subFolderName) throws IOException {
        try {
            // Call the admin service
            String subFolderId = adminDriveService.createSubFolder(subFolderName, parentFolderId);
            return ResponseEntity.ok(subFolderId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create admin subfolder: " + e.getMessage());
        }
    }

    /**
     * Uploads a file to a specified folder in the Admin Google Drive.
     */
    @PostMapping("/upload-file")
    public ResponseEntity<String> uploadFile(
            @RequestParam("folderId") String folderId, // This folderId must exist in the Admin Drive
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mimeType", required = false) String mimeType) throws IOException {
        try {
            // Call the admin service
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("File cannot be empty.");
            }
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed_file";
            String effectiveMimeType = mimeType != null ? mimeType : file.getContentType();
            if (effectiveMimeType == null) {
                effectiveMimeType = "application/octet-stream";
            }
            String fileId = adminDriveService.uploadFile(folderId, fileName, file.getInputStream(), effectiveMimeType);
            return ResponseEntity.ok(fileId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload admin file: " + e.getMessage());
        }
    }

    /**
     * Retrieves the list of subfolders in a parent folder in the Admin Drive.
     */
    @GetMapping("/subfolders")
    public ResponseEntity<List<Map<String, String>>> getSubFolders(@RequestParam("parentFolderId") String parentFolderId) throws IOException {
        try {
            // Call the admin service
            List<Map<String, String>> subFolders = adminDriveService.getSubFoldersList(parentFolderId);
            return ResponseEntity.ok(subFolders);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Retrieves the list of files in a folder in the Admin Drive.
     */
    @GetMapping("/files")
    public ResponseEntity<List<Map<String, String>>> getFiles(@RequestParam("folderId") String folderId) throws IOException {
        try {
            // Call the admin service
            List<Map<String, String>> files = adminDriveService.getFilesList(folderId);
            return ResponseEntity.ok(files);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Retrieves the permissions for a folder in the Admin Drive.
     */
    @GetMapping("/permissions")
    public ResponseEntity<List<Map<String, String>>> getFolderPermissions(@RequestParam("folderId") String folderId) throws IOException {
        try {
            // Call the admin service
            List<Map<String, String>> permissions = adminDriveService.getFolderPermissions(folderId).stream()
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
     * Shares a folder in the Admin Drive with a user by email.
     */
    @PostMapping("/share-folder")
    public ResponseEntity<String> shareFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("email") String email,
            @RequestParam("role") String role) throws IOException {
        try {
            // Call the admin service
            adminDriveService.shareFolder(folderId, email, role);
            return ResponseEntity.ok("Admin folder shared successfully with " + email);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to share admin folder: " + e.getMessage());
        }
    }

    /**
     * Removes a permission from a folder in the Admin Drive.
     */
    @DeleteMapping("/permissions")
    public ResponseEntity<String> removePermission(
            @RequestParam("folderId") String folderId,
            @RequestParam("permissionId") String permissionId) throws IOException {
        try {
            // Call the admin service
            adminDriveService.removePermission(folderId, permissionId);
            return ResponseEntity.ok("Admin permission removed successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to remove admin permission: " + e.getMessage());
        }
    }

    /**
     * Retrieves the name of a file by its file ID from the Admin Drive.
     */
    @GetMapping("/files/{fileId}/name")
    public ResponseEntity<Map<String, String>> getFileName(@PathVariable String fileId) throws IOException {
        try {
            // Call the admin service
            String fileName = adminDriveService.getFileName(fileId);
            return ResponseEntity.ok(Map.of("name", fileName));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid input: " + e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve admin file name: " + e.getMessage()));
        }
    }

    // Add other admin-specific endpoints as needed...

}