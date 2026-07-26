package com.erp.backend.controller;

import com.erp.backend.entity.UserModulePermission;
import com.erp.backend.service.UserPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-permissions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserPermissionController {

    private final UserPermissionService
        userPermissionService;

    // Get all permissions for a user
    // (role + individual)
    @GetMapping("/{username}")
    public ResponseEntity<?> getUserPermissions(
            @PathVariable String username) {
        try {
            return ResponseEntity.ok(
                userPermissionService
                    .getAllPermissionsForUser(username));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Get only individual permissions for a user
    @GetMapping("/{username}/individual")
    public ResponseEntity<List<UserModulePermission>>
            getIndividualPermissions(
            @PathVariable String username) {
        return ResponseEntity.ok(
            userPermissionService
                .getUserPermissions(username));
    }

    // Check if user has specific permission
    @GetMapping("/check")
    public ResponseEntity<?> checkPermission(
            @RequestParam String username,
            @RequestParam String module,
            @RequestParam String permission) {
        try {
            boolean hasPermission =
                userPermissionService.hasPermission(
                    username, module, permission);
            return ResponseEntity.ok(Map.of(
                "username", username,
                "module", module,
                "permission", permission,
                "hasPermission", hasPermission
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Assign individual permission to user
    @PostMapping("/assign")
    public ResponseEntity<?> assignPermission(
            @RequestBody Map<String, String> request) {
        try {
            UserModulePermission ump =
                userPermissionService.assignPermission(
                    request.get("username"),
                    request.get("module"),
                    request.get("permission")
                );
            return ResponseEntity.ok(ump);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Remove individual permission from user
    @DeleteMapping("/remove")
    public ResponseEntity<?> removePermission(
            @RequestBody Map<String, String> request) {
        try {
            userPermissionService.removePermission(
                request.get("username"),
                request.get("module"),
                request.get("permission")
            );
            return ResponseEntity.ok(
                "Permission removed successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }
}