package com.erp.backend.service;

import com.erp.backend.entity.Module;
import com.erp.backend.entity.Permission;
import com.erp.backend.entity.Role;
import com.erp.backend.entity.RoleModulePermission;
import com.erp.backend.repository.ModuleRepository;
import com.erp.backend.repository.PermissionRepository;
import com.erp.backend.repository.RoleModulePermissionRepository;
import com.erp.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final RoleModulePermissionRepository roleModulePermissionRepository;
    private final RoleRepository roleRepository;
    private final ModuleRepository moduleRepository;
    private final PermissionRepository permissionRepository;

    // Get all permissions for a role
    public List<RoleModulePermission> getPermissionsByRole(String roleName) {
        Role role = roleRepository.findByName(roleName);
        return roleModulePermissionRepository.findByRole(role);
    }

    // Check if role has specific permission on a module
    public boolean hasPermission(String roleName, 
                                  String moduleName, 
                                  String permissionName) {
        Role role = roleRepository.findByName(roleName);
        Module module = moduleRepository.findByName(moduleName);
        Permission permission = permissionRepository.findByName(permissionName);
        
        return roleModulePermissionRepository
            .existsByRoleAndModuleAndPermission(role, module, permission);
    }

    // Assign permission to role on a module
    public RoleModulePermission assignPermission(String roleName,
                                                  String moduleName,
                                                  String permissionName) {
        Role role = roleRepository.findByName(roleName);
        Module module = moduleRepository.findByName(moduleName);
        Permission permission = permissionRepository.findByName(permissionName);

        RoleModulePermission rmp = new RoleModulePermission();
        rmp.setRole(role);
        rmp.setModule(module);
        rmp.setPermission(permission);

        return roleModulePermissionRepository.save(rmp);
    }

    // Remove permission from role on a module
    public void removePermission(Long permissionId) {
        roleModulePermissionRepository.deleteById(permissionId);
    }
}