import { describe, expect, test } from "bun:test";
import { EmailServiceError } from "./email.service";

describe("EmailService", () => {
  describe("EmailServiceError", () => {
    test("should create error with message", () => {
      const originalError = new Error("Original error");
      const error = new EmailServiceError("Test error message", originalError);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("EmailServiceError");
      expect(error.message).toBe("Test error message");
    });

    test("should store original error", () => {
      const originalError = new Error("Original");
      const error = new EmailServiceError("Wrapped error", originalError);

      expect(error.originalError).toBe(originalError);
    });

    test("should have correct error properties", () => {
      const originalError = new Error("SMTP Failed");
      const error = new EmailServiceError("Failed to send email", originalError);

      expect(error.message).toBe("Failed to send email");
      expect(error.name).toBe("EmailServiceError");
      expect(error.originalError).toBe(originalError);
      expect(error.originalError).toBeInstanceOf(Error);
    });
  });
});
