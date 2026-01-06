import { describe, expect, test } from "bun:test";
import { ValidationUtils } from "./validation.utils";

describe("ValidationUtils", () => {
  describe("isValidCPF", () => {
    test("should validate correct CPF without mask", () => {
      expect(ValidationUtils.isValidCPF("12345678909")).toBe(true);
      expect(ValidationUtils.isValidCPF("11144477735")).toBe(true);
      expect(ValidationUtils.isValidCPF("52998224725")).toBe(true);
    });

    test("should validate correct CPF with mask", () => {
      expect(ValidationUtils.isValidCPF("123.456.789-09")).toBe(true);
      expect(ValidationUtils.isValidCPF("111.444.777-35")).toBe(true);
      expect(ValidationUtils.isValidCPF("529.982.247-25")).toBe(true);
    });

    test("should reject CPF with all same digits", () => {
      expect(ValidationUtils.isValidCPF("00000000000")).toBe(false);
      expect(ValidationUtils.isValidCPF("11111111111")).toBe(false);
      expect(ValidationUtils.isValidCPF("99999999999")).toBe(false);
    });

    test("should reject CPF with wrong length", () => {
      expect(ValidationUtils.isValidCPF("123456789")).toBe(false);
      expect(ValidationUtils.isValidCPF("1234567890123")).toBe(false);
      expect(ValidationUtils.isValidCPF("")).toBe(false);
    });

    test("should reject CPF with invalid check digits", () => {
      expect(ValidationUtils.isValidCPF("12345678900")).toBe(false);
      expect(ValidationUtils.isValidCPF("12345678910")).toBe(false);
      expect(ValidationUtils.isValidCPF("12345678999")).toBe(false);
    });

    test("should handle CPF with special characters", () => {
      expect(ValidationUtils.isValidCPF("123.456.789-09")).toBe(true);
      expect(ValidationUtils.isValidCPF("123-456-789-09")).toBe(true); // Also accepts any separator
    });

    test("should reject letters in CPF", () => {
      expect(ValidationUtils.isValidCPF("123abc78909")).toBe(false);
    });
  });

  describe("isValidCNPJ", () => {
    test("should validate correct CNPJ without mask", () => {
      expect(ValidationUtils.isValidCNPJ("11222333000181")).toBe(true);
      expect(ValidationUtils.isValidCNPJ("00000000000191")).toBe(true);
    });

    test("should validate correct CNPJ with mask", () => {
      expect(ValidationUtils.isValidCNPJ("11.222.333/0001-81")).toBe(true);
      expect(ValidationUtils.isValidCNPJ("00.000.000/0001-91")).toBe(true);
    });

    test("should reject CNPJ with all same digits", () => {
      expect(ValidationUtils.isValidCNPJ("00000000000000")).toBe(false);
      expect(ValidationUtils.isValidCNPJ("11111111111111")).toBe(false);
      expect(ValidationUtils.isValidCNPJ("99999999999999")).toBe(false);
    });

    test("should reject CNPJ with wrong length", () => {
      expect(ValidationUtils.isValidCNPJ("1122233300018")).toBe(false);
      expect(ValidationUtils.isValidCNPJ("112223330001811")).toBe(false);
      expect(ValidationUtils.isValidCNPJ("")).toBe(false);
    });

    test("should reject CNPJ with invalid check digits", () => {
      expect(ValidationUtils.isValidCNPJ("11222333000180")).toBe(false);
      expect(ValidationUtils.isValidCNPJ("11222333000182")).toBe(false);
    });

    test("should handle CNPJ with special characters", () => {
      expect(ValidationUtils.isValidCNPJ("11.222.333/0001-81")).toBe(true);
    });
  });

  describe("isValidEmail", () => {
    test("should validate correct emails", () => {
      expect(ValidationUtils.isValidEmail("test@example.com")).toBe(true);
      expect(ValidationUtils.isValidEmail("user.name@example.com")).toBe(true);
      expect(ValidationUtils.isValidEmail("user+tag@example.co.uk")).toBe(true);
      expect(ValidationUtils.isValidEmail("test123@subdomain.example.com")).toBe(true);
    });

    test("should reject invalid emails", () => {
      expect(ValidationUtils.isValidEmail("")).toBe(false);
      expect(ValidationUtils.isValidEmail("invalid")).toBe(false);
      expect(ValidationUtils.isValidEmail("@example.com")).toBe(false);
      expect(ValidationUtils.isValidEmail("user@")).toBe(false);
      expect(ValidationUtils.isValidEmail("user@.com")).toBe(false);
      expect(ValidationUtils.isValidEmail("user name@example.com")).toBe(false);
    });

    test("should reject emails without domain extension", () => {
      expect(ValidationUtils.isValidEmail("user@domain")).toBe(false);
    });

    test("should reject emails with spaces", () => {
      expect(ValidationUtils.isValidEmail("user @example.com")).toBe(false);
      expect(ValidationUtils.isValidEmail("user@ example.com")).toBe(false);
      expect(ValidationUtils.isValidEmail(" user@example.com")).toBe(false);
    });

    test("should accept emails with numbers and special chars", () => {
      expect(ValidationUtils.isValidEmail("user123@example.com")).toBe(true);
      expect(ValidationUtils.isValidEmail("user_name@example.com")).toBe(true);
      expect(ValidationUtils.isValidEmail("user-name@example.com")).toBe(true);
      expect(ValidationUtils.isValidEmail("user.name+tag@example.com")).toBe(true);
    });
  });

  describe("isValidPhone", () => {
    test("should validate correct Brazilian cell phone", () => {
      expect(ValidationUtils.isValidPhone("11987654321")).toBe(true);
      expect(ValidationUtils.isValidPhone("21987654321")).toBe(true);
      expect(ValidationUtils.isValidPhone("85912345678")).toBe(true);
    });

    test("should validate cell phone with mask", () => {
      expect(ValidationUtils.isValidPhone("(11) 98765-4321")).toBe(true);
      expect(ValidationUtils.isValidPhone("(21) 9 8765-4321")).toBe(true);
    });

    test("should accept landline (10 digits)", () => {
      expect(ValidationUtils.isValidPhone("1133334444")).toBe(true);
      expect(ValidationUtils.isValidPhone("(11) 3333-4444")).toBe(true);
    });

    test("should reject phone with wrong length", () => {
      expect(ValidationUtils.isValidPhone("119876543")).toBe(false);
      expect(ValidationUtils.isValidPhone("119876543210")).toBe(false);
    });

    test("should reject phone without DDD", () => {
      expect(ValidationUtils.isValidPhone("987654321")).toBe(false);
    });

    test("should reject phone with invalid DDD (00)", () => {
      expect(ValidationUtils.isValidPhone("00987654321")).toBe(false);
    });

    test("should reject phone not starting with 9", () => {
      expect(ValidationUtils.isValidPhone("11887654321")).toBe(false);
      expect(ValidationUtils.isValidPhone("11787654321")).toBe(false);
    });
  });

  describe("hasFullName", () => {
    test("should accept full names", () => {
      expect(ValidationUtils.hasFullName("João Silva")).toBe(true);
      expect(ValidationUtils.hasFullName("Maria Santos Oliveira")).toBe(true);
      expect(ValidationUtils.hasFullName("José da Silva")).toBe(true);
    });

    test("should reject single names", () => {
      expect(ValidationUtils.hasFullName("João")).toBe(false);
      expect(ValidationUtils.hasFullName("Maria")).toBe(false);
    });

    test("should handle multiple spaces", () => {
      expect(ValidationUtils.hasFullName("João  Silva")).toBe(true);
      expect(ValidationUtils.hasFullName("  João Silva  ")).toBe(true);
    });

    test("should reject empty strings", () => {
      expect(ValidationUtils.hasFullName("")).toBe(false);
      expect(ValidationUtils.hasFullName("   ")).toBe(false);
    });

    test("should reject names with only one part after trim", () => {
      expect(ValidationUtils.hasFullName("João ")).toBe(false);
      expect(ValidationUtils.hasFullName(" João")).toBe(false);
    });

    test("should accept names with accents", () => {
      expect(ValidationUtils.hasFullName("José María")).toBe(true);
      expect(ValidationUtils.hasFullName("François André")).toBe(true);
    });
  });

  describe("sanitizeName", () => {
    test("should remove dangerous HTML characters", () => {
      expect(ValidationUtils.sanitizeName("João<script>")).toBe("Joãoscript");
      expect(ValidationUtils.sanitizeName("<b>Maria</b>")).toBe("bMaria/b");
      expect(ValidationUtils.sanitizeName("Test>Name")).toBe("TestName");
    });

    test("should trim whitespace", () => {
      expect(ValidationUtils.sanitizeName("  João Silva  ")).toBe("João Silva");
      expect(ValidationUtils.sanitizeName("\nJoão\n")).toBe("João");
    });

    test("should keep valid characters", () => {
      expect(ValidationUtils.sanitizeName("João da Silva")).toBe("João da Silva");
      expect(ValidationUtils.sanitizeName("Mary-Anne O'Brien")).toBe("Mary-Anne O'Brien");
    });

    test("should handle empty string", () => {
      expect(ValidationUtils.sanitizeName("")).toBe("");
      expect(ValidationUtils.sanitizeName("   ")).toBe("");
    });

    test("should keep accented characters", () => {
      expect(ValidationUtils.sanitizeName("José María")).toBe("José María");
      expect(ValidationUtils.sanitizeName("François André")).toBe("François André");
    });
  });

  describe("sanitizeEmail", () => {
    test("should convert to lowercase", () => {
      expect(ValidationUtils.sanitizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
      expect(ValidationUtils.sanitizeEmail("TeSt@ExAmPlE.cOm")).toBe("test@example.com");
    });

    test("should trim whitespace", () => {
      expect(ValidationUtils.sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
      expect(ValidationUtils.sanitizeEmail("\nuser@example.com\n")).toBe("user@example.com");
    });

    test("should handle already clean emails", () => {
      expect(ValidationUtils.sanitizeEmail("user@example.com")).toBe("user@example.com");
    });

    test("should handle empty string", () => {
      expect(ValidationUtils.sanitizeEmail("")).toBe("");
      expect(ValidationUtils.sanitizeEmail("   ")).toBe("");
    });

    test("should preserve special characters", () => {
      expect(ValidationUtils.sanitizeEmail("User+Tag@Example.Com")).toBe("user+tag@example.com");
      expect(ValidationUtils.sanitizeEmail("User_Name@Example.Com")).toBe("user_name@example.com");
    });
  });

  describe("isValidName", () => {
    test("should validate names with only letters", () => {
      expect(ValidationUtils.isValidName("João")).toBe(true);
      expect(ValidationUtils.isValidName("Maria Silva")).toBe(true);
      expect(ValidationUtils.isValidName("José da Silva")).toBe(true);
    });

    test("should validate names with accents", () => {
      expect(ValidationUtils.isValidName("José María")).toBe(true);
      expect(ValidationUtils.isValidName("François André")).toBe(true);
      expect(ValidationUtils.isValidName("Müller")).toBe(true);
    });

    test("should reject names with numbers", () => {
      expect(ValidationUtils.isValidName("João123")).toBe(false);
      expect(ValidationUtils.isValidName("Maria 2")).toBe(false);
    });

    test("should reject names with special characters", () => {
      expect(ValidationUtils.isValidName("João@Silva")).toBe(false);
      expect(ValidationUtils.isValidName("Maria!")).toBe(false);
      expect(ValidationUtils.isValidName("José#Santos")).toBe(false);
    });

    test("should allow spaces", () => {
      expect(ValidationUtils.isValidName("João Silva Santos")).toBe(true);
    });

    test("should reject empty string", () => {
      expect(ValidationUtils.isValidName("")).toBe(false);
    });

    test("should reject names with hyphens (strict)", () => {
      expect(ValidationUtils.isValidName("Mary-Anne")).toBe(false);
    });
  });

  describe("isValidUUID", () => {
    test("should validate correct UUIDs", () => {
      expect(ValidationUtils.isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(ValidationUtils.isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    test("should validate UUID with uppercase", () => {
      expect(ValidationUtils.isValidUUID("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
    });

    test("should reject invalid UUIDs", () => {
      expect(ValidationUtils.isValidUUID("")).toBe(false);
      expect(ValidationUtils.isValidUUID("not-a-uuid")).toBe(false);
      expect(ValidationUtils.isValidUUID("123e4567-e89b-12d3-a456")).toBe(false);
    });

    test("should reject UUID without hyphens", () => {
      expect(ValidationUtils.isValidUUID("123e4567e89b12d3a456426614174000")).toBe(false);
    });

    test("should reject UUID with wrong format", () => {
      expect(ValidationUtils.isValidUUID("123e4567-e89b-12d3-a456-42661417400")).toBe(false); // Too short
      expect(ValidationUtils.isValidUUID("123e4567-e89b-12d3-a456-4266141740000")).toBe(false); // Too long
    });

    test("should reject UUID with invalid characters", () => {
      expect(ValidationUtils.isValidUUID("123e4567-e89b-12d3-a456-42661417400g")).toBe(false);
      expect(ValidationUtils.isValidUUID("123e4567-e89b-12d3-a456-42661417400!")).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    test("should accept strong password", () => {
      const errors = ValidationUtils.validatePasswordStrength("SecureP@ss123");
      expect(errors).toEqual([]);
    });

    test("should reject password too short", () => {
      const errors = ValidationUtils.validatePasswordStrength("Short1!");
      expect(errors).toContain("mínimo 8 caracteres");
    });

    test("should reject password too long", () => {
      const veryLong = `${"A".repeat(101)}a1!`;
      const errors = ValidationUtils.validatePasswordStrength(veryLong);
      expect(errors).toContain("máximo 100 caracteres");
    });

    test("should reject password without uppercase", () => {
      const errors = ValidationUtils.validatePasswordStrength("lowercase123!");
      expect(errors).toContain("uma letra maiúscula");
    });

    test("should reject password without lowercase", () => {
      const errors = ValidationUtils.validatePasswordStrength("UPPERCASE123!");
      expect(errors).toContain("uma letra minúscula");
    });

    test("should reject password without numbers", () => {
      const errors = ValidationUtils.validatePasswordStrength("NoNumbers!");
      expect(errors).toContain("um número");
    });

    test("should reject password without special characters", () => {
      const errors = ValidationUtils.validatePasswordStrength("NoSpecial123");
      expect(errors).toContain("um caractere especial (!@#$%...)");
    });

    test("should reject common passwords", () => {
      expect(ValidationUtils.validatePasswordStrength("Password123!")).toContain(
        "senha muito comum",
      );
      expect(ValidationUtils.validatePasswordStrength("12345678Aa!")).toContain(
        "senha muito comum",
      );
      expect(ValidationUtils.validatePasswordStrength("Qwerty123!")).toContain("senha muito comum");
    });

    test("should return multiple errors for weak password", () => {
      const errors = ValidationUtils.validatePasswordStrength("weak");
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain("mínimo 8 caracteres");
      expect(errors).toContain("uma letra maiúscula");
      expect(errors).toContain("um número");
      expect(errors).toContain("um caractere especial (!@#$%...)");
    });

    test("should accept various special characters", () => {
      expect(ValidationUtils.validatePasswordStrength("Secure789!").length).toBe(0);
      expect(ValidationUtils.validatePasswordStrength("Secure789@").length).toBe(0);
      expect(ValidationUtils.validatePasswordStrength("Secure789#").length).toBe(0);
      expect(ValidationUtils.validatePasswordStrength("Secure789$").length).toBe(0);
      expect(ValidationUtils.validatePasswordStrength("Secure789%").length).toBe(0);
    });

    test("should handle empty password", () => {
      const errors = ValidationUtils.validatePasswordStrength("");
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain("mínimo 8 caracteres");
    });

    test("should handle password with unicode characters", () => {
      const errors = ValidationUtils.validatePasswordStrength("Sécûré123!");
      expect(errors).toEqual([]);
    });
  });

  describe("Integration tests", () => {
    test("should sanitize and validate email flow", () => {
      const rawEmail = "  USER@Example.COM  ";
      const sanitized = ValidationUtils.sanitizeEmail(rawEmail);
      const isValid = ValidationUtils.isValidEmail(sanitized);

      expect(sanitized).toBe("user@example.com");
      expect(isValid).toBe(true);
    });

    test("should sanitize and validate name flow", () => {
      const rawName = "  João <script>Silva  ";
      const sanitized = ValidationUtils.sanitizeName(rawName);
      const hasComplete = ValidationUtils.hasFullName(sanitized);

      expect(sanitized).toBe("João scriptSilva");
      expect(hasComplete).toBe(true);
    });

    test("should validate complete user registration data", () => {
      const userData = {
        name: "João Silva Santos",
        email: "joao@example.com",
        cpf: "123.456.789-09",
        phone: "(11) 98765-4321",
        password: "SecureP@ss123",
      };

      expect(ValidationUtils.hasFullName(userData.name)).toBe(true);
      expect(ValidationUtils.isValidName(userData.name)).toBe(true);
      expect(ValidationUtils.isValidEmail(userData.email)).toBe(true);
      expect(ValidationUtils.isValidCPF(userData.cpf)).toBe(true);
      expect(ValidationUtils.isValidPhone(userData.phone)).toBe(true);
      expect(ValidationUtils.validatePasswordStrength(userData.password)).toEqual([]);
    });

    test("should catch invalid user registration data", () => {
      const userData = {
        name: "João",
        email: "invalid-email",
        cpf: "00000000000",
        phone: "119876543", // Invalid length (9 digits)
        password: "weak",
      };

      expect(ValidationUtils.hasFullName(userData.name)).toBe(false);
      expect(ValidationUtils.isValidEmail(userData.email)).toBe(false);
      expect(ValidationUtils.isValidCPF(userData.cpf)).toBe(false);
      expect(ValidationUtils.isValidPhone(userData.phone)).toBe(false);
      expect(ValidationUtils.validatePasswordStrength(userData.password).length).toBeGreaterThan(0);
    });
  });
});
