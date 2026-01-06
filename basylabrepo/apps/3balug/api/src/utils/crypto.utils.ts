import crypto from "node:crypto";

export const CryptoUtils = {
  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 12,
    });
  },

  /**
   * Verify a password against a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns true if password matches hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  },

  /**
   * Generate a secure random string
   * @param length - Length of the string
   * @returns Random hex string
   */
  generateSecureRandomString(length: number): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString("hex")
      .slice(0, length);
  },

  /**
   * Generate a random UUID
   * @returns UUID string
   */
  generateUUID(): string {
    return crypto.randomUUID();
  },

  /**
   * Generate a secure random password
   * @param length - Length of the password (default: 16)
   * @returns Random password with letters, numbers and special characters
   */
  generateRandomPassword(length = 16): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%&*";
    const all = lowercase + uppercase + numbers + special;

    const getRandomIndex = (max: number): number => {
      const randomBytes = crypto.randomBytes(4);
      const randomInt = randomBytes.readUInt32BE(0);
      return randomInt % max;
    };

    const password = [
      lowercase[getRandomIndex(lowercase.length)],
      uppercase[getRandomIndex(uppercase.length)],
      numbers[getRandomIndex(numbers.length)],
      special[getRandomIndex(special.length)],
    ];

    for (let i = password.length; i < length; i++) {
      password.push(all[getRandomIndex(all.length)]);
    }

    const shuffled = [...password];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getRandomIndex(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.join("");
  },
};
