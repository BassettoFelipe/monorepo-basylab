import { ValidationUtils } from "./validation.utils";

export interface PasswordValidationResult {
  isValid: boolean;
  errors?: string[];
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors = ValidationUtils.validatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
