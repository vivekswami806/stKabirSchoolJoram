// authRoleMap.ts
export const ROLE_CONFIG = {
    PARENT: {
      apiRole: "student",
      homeRoute: "/(tabs)/home",
    },
    STAFF: {
      apiRole: "staff",
      homeRoute: "/(tabs)/home",
    },
    ADMIN: {
      apiRole: "admin",
      homeRoute: "/(admin)/dashboard",
    },
  } as const;
  
  export type UserRole = keyof typeof ROLE_CONFIG;
  