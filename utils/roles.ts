export type TeamRole = {
    role: "admin" | "member";
    is_super_admin: boolean;
};

// Role access levels from highest to lowest
export const ROLE_LEVELS = {
    SUPER_ADMIN: 3,
    ADMIN: 2,
    MEMBER: 1,
} as const;

// Define specific capabilities for each role
export const ROLE_CAPABILITIES = {
    // Base capabilities (available to all roles)
    BASE: [
        "view_team",
        "view_projects",
        "update_own_profile",
        "participate_in_projects",
    ],

    // Admin capabilities
    ADMIN: [
        "create_projects",
        "edit_projects",
        "delete_projects",
        "invite_members",
        "set_member_roles",
        "remove_members",
    ],

    // Super Admin exclusive capabilities
    SUPER_ADMIN: [
        "delete_team",
        "remove_admins",
        "transfer_super_admin",
    ],
} as const;

export type Capability =
    | typeof ROLE_CAPABILITIES.BASE[number]
    | typeof ROLE_CAPABILITIES.ADMIN[number]
    | typeof ROLE_CAPABILITIES.SUPER_ADMIN[number];

export function getRoleLevel(role: TeamRole): number {
    if (role.is_super_admin) return ROLE_LEVELS.SUPER_ADMIN;
    if (role.role === "admin") return ROLE_LEVELS.ADMIN;
    return ROLE_LEVELS.MEMBER;
}

export function hasRoleAccess(
    userRole: TeamRole,
    requiredRole: keyof typeof ROLE_LEVELS,
): boolean {
    const userLevel = getRoleLevel(userRole);
    const requiredLevel = ROLE_LEVELS[requiredRole];
    return userLevel >= requiredLevel;
}

// Helper to get role display name
export function getRoleDisplay(role: TeamRole): string {
    if (role.is_super_admin) return "Owner";
    if (role.role === "admin") return "Admin";
    return "Member";
}

// Helper to get role color
export function getRoleColor(role: TeamRole): string {
    if (role.is_super_admin) return "text-purple-500";
    if (role.role === "admin") return "text-blue-500";
    return "text-green-500";
}

// Check if a user has a specific capability
export function hasCapability(role: TeamRole, capability: Capability): boolean {
    // Base capabilities are available to all roles
    if (
        ROLE_CAPABILITIES.BASE.includes(
            capability as typeof ROLE_CAPABILITIES.BASE[number],
        )
    ) {
        return true;
    }

    // Super Admin has all capabilities
    if (role.is_super_admin) {
        return true;
    }

    // Admin has admin capabilities but not super admin capabilities
    if (role.role === "admin") {
        return ROLE_CAPABILITIES.ADMIN.includes(
            capability as typeof ROLE_CAPABILITIES.ADMIN[number],
        );
    }

    // Members only have base capabilities
    return false;
}

// Check if a user can manage another user's role
export function canManageRole(
    userRole: TeamRole,
    targetRole: TeamRole,
): boolean {
    // Super Admin can manage everyone except themselves
    if (userRole.is_super_admin) {
        return true;
    }

    // Admins can only manage members
    if (userRole.role === "admin") {
        return targetRole.role === "member" && !targetRole.is_super_admin;
    }

    return false;
}

// Example usage:
// const canDeleteTeam = hasCapability(userRole, 'delete_team');
// const canManageUser = canManageRole(currentUserRole, targetUserRole);
