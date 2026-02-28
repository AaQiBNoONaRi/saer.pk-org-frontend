/**
 * Permission Helper Utility
 * Check if current user has specific permissions
 */

// Get current user permissions from localStorage
export const getCurrentPermissions = () => {
    try {
        // Check if employee
        const employeeData = localStorage.getItem('employee_data');
        if (employeeData) {
            const data = JSON.parse(employeeData);
            return data?.permissions || [];
        }

        // Check if admin (admins have all permissions)
        const userData = localStorage.getItem('user_data') || localStorage.getItem('admin_data');
        if (userData) {
            return ['*']; // Wildcard - admins have all permissions
        }

        return [];
    } catch {
        return [];
    }
};

// Get current user info
export const getCurrentUser = () => {
    try {
        const employeeData = localStorage.getItem('employee_data');
        if (employeeData) {
            const data = JSON.parse(employeeData);
            return {
                type: 'employee',
                id: data?._id || data?.id,
                name: data?.name || data?.full_name,
                email: data?.email,
                ...data
            };
        }

        const userData = localStorage.getItem('user_data') || localStorage.getItem('admin_data');
        if (userData) {
            const data = JSON.parse(userData);
            return {
                type: 'admin',
                id: data?._id || data?.id,
                name: data?.name,
                email: data?.email,
                ...data
            };
        }

        return null;
    } catch {
        return null;
    }
};

// Check if user has a specific permission
export const hasPermission = (permissionCode) => {
    const permissions = getCurrentPermissions();

    // Admins have all permissions
    if (permissions.includes('*')) return true;

    // Check exact match
    if (permissions.includes(permissionCode)) return true;

    // Check if any permission starts with the code (e.g., "customers." matches "customers.view")
    return permissions.some(p => p.startsWith(permissionCode));
};

// Check if user has any of the specified actions for a module
export const hasModulePermission = (module, action) => {
    const permissions = getCurrentPermissions();

    // Admins have all permissions
    if (permissions.includes('*')) return true;

    // Check for legacy format (e.g., "crm", "employees")
    if (permissions.includes(module)) return true;

    // Check for new RBAC format (e.g., "customers.leads.view")
    const permissionCode = `${module}.${action}`;
    if (permissions.includes(permissionCode)) return true;

    // Check if "all" permission exists for the module
    const allPermissionCode = `${module}.all`;
    if (permissions.includes(allPermissionCode)) return true;

    // Check prefix match
    return permissions.some(p => p.startsWith(permissionCode));
};

// Check multiple actions at once
export const hasAnyModulePermission = (module, actions = []) => {
    return actions.some(action => hasModulePermission(module, action));
};

// Permission object for a module (useful for UI rendering)
export const getModulePermissions = (module) => {
    const permissions = getCurrentPermissions();

    // Admins have all permissions
    if (permissions.includes('*')) {
        return {
            view: true,
            add: true,
            update: true,
            delete: true,
            all: true
        };
    }

    // Legacy format check
    if (permissions.includes(module)) {
        return {
            view: true,
            add: true,
            update: true,
            delete: true,
            all: true
        };
    }

    // New RBAC format
    const result = {
        view: false,
        add: false,
        update: false,
        delete: false,
        all: false
    };

    permissions.forEach(p => {
        if (p.startsWith(module)) {
            const parts = p.split('.');
            const action = parts[parts.length - 1]; // Last part is the action
            if (['view', 'add', 'update', 'delete', 'all'].includes(action)) {
                result[action] = true;
            }
        }
    });

    // If "all" is true, set all actions to true
    if (result.all) {
        result.view = true;
        result.add = true;
        result.update = true;
        result.delete = true;
    }

    return result;
};

// Check if user is admin
export const isAdmin = () => {
    try {
        const userData = localStorage.getItem('user_data') || localStorage.getItem('admin_data');
        return !!userData;
    } catch {
        return false;
    }
};

// Check if user is employee
export const isEmployee = () => {
    try {
        const employeeData = localStorage.getItem('employee_data');
        return !!employeeData;
    } catch {
        return false;
    }
};
