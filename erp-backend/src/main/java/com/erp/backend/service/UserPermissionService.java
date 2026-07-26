package com.erp.backend.service;

import com.erp.backend.entity.Module;
import com.erp.backend.entity.Permission;
import com.erp.backend.entity.User;
import com.erp.backend.entity.UserModulePermission;
import com.erp.backend.repository.ModuleRepository;
import com.erp.backend.repository.PermissionRepository;
import com.erp.backend.repository.RoleModulePermissionRepository;
import com.erp.backend.repository.UserModulePermissionRepository;
import com.erp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserPermissionService {

    private final UserModulePermissionRepository
        userModulePermissionRepository;
    private final RoleModulePermissionRepository
        roleModulePermissionRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final PermissionRepository permissionRepository;

    // Get all individual permissions for a user
    public List<UserModulePermission>
            getUserPermissions(String username) {
        User user = userRepository
            .findByUsername(username)
            .orElseThrow(() ->
                new RuntimeException("User not found!"));
        return userModulePermissionRepository
            .findByUser(user);
    }

    // Check permission - individual first, then role
    public boolean hasPermission(
            String username,
            String moduleName,
            String permissionName) {

        User user = userRepository
            .findByUsername(username)
            .orElseThrow(() ->
                new RuntimeException("User not found!"));

        Module module = moduleRepository
            .findByName(moduleName);
        Permission permission = permissionRepository
            .findByName(permissionName);

        if (module == null || permission == null) {
            return false;
        }

        // Check individual permission first
        boolean hasIndividual =
            userModulePermissionRepository
                .existsByUserAndModuleAndPermission(
                    user, module, permission);

        if (hasIndividual) return true;

        // Fall back to role permission
        return roleModulePermissionRepository
            .existsByRoleAndModuleAndPermission(
                user.getRole(), module, permission);
    }

    // Assign individual permission to user
    public UserModulePermission assignPermission(
            String username,
            String moduleName,
            String permissionName) {

        User user = userRepository
            .findByUsername(username)
            .orElseThrow(() ->
                new RuntimeException("User not found!"));

        Module module = moduleRepository
            .findByName(moduleName);
        Permission permission = permissionRepository
            .findByName(permissionName);

        if (module == null) {
            throw new RuntimeException("Module not found!");
        }
        if (permission == null) {
            throw new RuntimeException(
                "Permission not found!");
        }

        // Check if already exists
        if (userModulePermissionRepository
                .existsByUserAndModuleAndPermission(
                    user, module, permission)) {
            throw new RuntimeException(
                "Permission already assigned!");
        }

        UserModulePermission ump =
            new UserModulePermission();
        ump.setUser(user);
        ump.setModule(module);
        ump.setPermission(permission);
        ump.setStatus(1);

        return userModulePermissionRepository.save(ump);
    }

    // Remove individual permission from user
    @Transactional
    public void removePermission(
            String username,
            String moduleName,
            String permissionName) {

        User user = userRepository
            .findByUsername(username)
            .orElseThrow(() ->
                new RuntimeException("User not found!"));

        Module module = moduleRepository
            .findByName(moduleName);
        Permission permission = permissionRepository
            .findByName(permissionName);

        userModulePermissionRepository
            .deleteByUserAndModuleAndPermission(
                user, module, permission);
    }

    // Get all permissions for user
    // (both role + individual combined)
    public java.util.Map<String, Object>
            getAllPermissionsForUser(String username) {

        User user = userRepository
            .findByUsername(username)
            .orElseThrow(() ->
                new RuntimeException("User not found!"));

        // Get role permissions
        List<?> rolePerms =
            roleModulePermissionRepository
                .findByRole(user.getRole());

        // Get individual permissions
        List<UserModulePermission> individualPerms =
            userModulePermissionRepository
                .findByUser(user);

        java.util.Map<String, Object> result =
            new java.util.HashMap<>();
        result.put("username", user.getUsername());
        result.put("role", user.getRole().getName());
        result.put("rolePermissions", rolePerms);
        result.put("individualPermissions",
            individualPerms);

        return result;
    }
}