package com.erp.backend.controller;

import com.erp.backend.entity.RoleModulePermission;
import com.erp.backend.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PermissionController {

    private final PermissionService permissionService;

    // Get all permissions for a role
    @GetMapping("/role/{roleName}")
    public ResponseEntity<List<RoleModulePermission>> getPermissionsByRole(
            @PathVariable String roleName) {
        return ResponseEntity.ok(
            permissionService.getPermissionsByRole(roleName));
    }

    // Check if role has specific permission on a module
    @GetMapping("/check")
    public ResponseEntity<?> checkPermission(
            @RequestParam String role,
            @RequestParam String module,
            @RequestParam String permission) {

        boolean hasPermission = permissionService
            .hasPermission(role, module, permission);

        return ResponseEntity.ok(Map.of(
            "role", role,
            "module", module,
            "permission", permission,
            "hasPermission", hasPermission
        ));
    }

    // Assign permission to role
    @PostMapping("/assign")
    public ResponseEntity<?> assignPermission(
            @RequestBody Map<String, String> request) {
        try {
            RoleModulePermission rmp = permissionService.assignPermission(
                request.get("role"),
                request.get("module"),
                request.get("permission")
            );
            return ResponseEntity.ok(rmp);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Remove permission from role
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removePermission(@PathVariable Long id) {
        try {
            permissionService.removePermission(id);
            return ResponseEntity.ok("Permission removed successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}