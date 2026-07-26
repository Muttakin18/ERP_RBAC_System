package com.erp.backend.config;

import com.erp.backend.entity.Module;
import com.erp.backend.entity.Permission;
import com.erp.backend.entity.Role;
import com.erp.backend.repository.ModuleRepository;
import com.erp.backend.repository.PermissionRepository;
import com.erp.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final ModuleRepository moduleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) throws Exception {

        // Insert Roles if not exists
        insertRoleIfNotExists("Admin");
        insertRoleIfNotExists("HR");
        insertRoleIfNotExists("TL");
        insertRoleIfNotExists("Employee");

        // Insert Modules if not exists
        insertModuleIfNotExists("Shift");
        insertModuleIfNotExists("Designation");
        insertModuleIfNotExists("Department");

        // Insert Permissions if not exists
        insertPermissionIfNotExists("VIEW");
        insertPermissionIfNotExists("ADD");
        insertPermissionIfNotExists("UPDATE");
        insertPermissionIfNotExists("DELETE");

        System.out.println("✅ Default data initialized successfully!");
    }

    private void insertRoleIfNotExists(String name) {
        if (roleRepository.findByName(name) == null) {
            Role role = new Role();
            role.setName(name);
            roleRepository.save(role);
        }
    }

    private void insertModuleIfNotExists(String name) {
        if (moduleRepository.findByName(name) == null) {
            Module module = new Module();
            module.setName(name);
            moduleRepository.save(module);
        }
    }

    private void insertPermissionIfNotExists(String name) {
        if (permissionRepository.findByName(name) == null) {
            Permission permission = new Permission();
            permission.setName(name);
            permissionRepository.save(permission);
        }
    }
}