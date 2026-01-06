export const USER_ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  BROKER: "broker",
  MANAGER: "manager",
  INSURANCE_ANALYST: "insurance_analyst",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
