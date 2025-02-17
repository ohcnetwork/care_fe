import { createContext, useContext, useMemo } from "react";

interface PermissionContextType {
  /**
   * Check if user has a specific permission in either their user permissions or object permissions
   * @param permission - The permission to check
   * @param objectPermissions - Optional object-specific permissions
   */
  hasPermission: (permission: string, objectPermissions?: string[]) => boolean;
  /**
   * Raw permissions array from the user
   */
  userPermissions: string[];
  /**
   * Whether the user is a super admin
   */
  isSuperAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

interface PermissionProviderProps {
  children: React.ReactNode;
  userPermissions: string[];
  isSuperAdmin?: boolean;
}

export function PermissionProvider({
  children,
  userPermissions,
  isSuperAdmin = false,
}: PermissionProviderProps) {
  const value = useMemo(() => {
    const hasPermission = (
      permission: string,
      objectPermissions?: string[],
    ) => {
      if (isSuperAdmin) return true;
      if (objectPermissions) {
        return objectPermissions.includes(permission);
      }
      return userPermissions.includes(permission);
    };

    return {
      hasPermission,
      userPermissions,
      isSuperAdmin,
    };
  }, [userPermissions, isSuperAdmin]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

export function useHasPermission(
  permission: string,
  objectPermissions?: string[],
) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission, objectPermissions);
}
