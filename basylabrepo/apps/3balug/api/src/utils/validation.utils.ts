export const ValidationUtils = {
  /**
   * Valida se um CPF é válido
   * @param cpf - CPF com ou sem máscara
   * @returns true se o CPF é válido, false caso contrário
   */
  isValidCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, "");

    if (cleanCPF.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(cleanCPF.charAt(i), 10) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== Number.parseInt(cleanCPF.charAt(9), 10)) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(cleanCPF.charAt(i), 10) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== Number.parseInt(cleanCPF.charAt(10), 10)) {
      return false;
    }

    return true;
  },

  /**
   * Valida se um CNPJ é válido
   * @param cnpj - CNPJ com ou sem máscara
   * @returns true se o CNPJ é válido, false caso contrário
   */
  isValidCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, "");

    if (cleanCNPJ.length !== 14) {
      return false;
    }

    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      return false;
    }

    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(cleanCNPJ.charAt(i), 10) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== Number.parseInt(cleanCNPJ.charAt(12), 10)) {
      return false;
    }

    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += Number.parseInt(cleanCNPJ.charAt(i), 10) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== Number.parseInt(cleanCNPJ.charAt(13), 10)) {
      return false;
    }

    return true;
  },

  /**
   * Valida se um email é válido
   * @param email - Email a ser validado
   * @returns true se o email é válido, false caso contrário
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida se um telefone brasileiro é válido (celular ou fixo)
   * @param phone - Telefone com ou sem máscara
   * @returns true se o telefone é válido, false caso contrário
   */
  isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length === 11) {
      return /^[1-9]{2}9[0-9]{8}$/.test(cleanPhone);
    }

    if (cleanPhone.length === 10) {
      return /^[1-9]{2}[2-5][0-9]{7}$/.test(cleanPhone);
    }

    return false;
  },

  /**
   * Valida se um CEP brasileiro é válido
   * @param cep - CEP com ou sem máscara
   * @returns true se o CEP é válido, false caso contrário
   */
  isValidCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, "");
    return cleanCEP.length === 8 && /^[0-9]{8}$/.test(cleanCEP);
  },

  /**
   * Valida se um nome completo tem pelo menos nome e sobrenome
   * @param name - Nome completo
   * @returns true se o nome tem pelo menos 2 partes, false caso contrário
   */
  hasFullName(name: string): boolean {
    const nameParts = name.trim().split(/\s+/);
    return nameParts.length >= 2 && nameParts.every((part) => part.length > 0);
  },

  /**
   * Sanitiza caracteres especiais perigosos de um nome
   * @param name - Nome a ser sanitizado
   * @returns Nome sanitizado
   */
  sanitizeName(name: string): string {
    return name.replace(/[<>]/g, "").trim();
  },

  /**
   * Sanitiza email (lowercase e trim)
   * @param email - Email a ser sanitizado
   * @returns Email sanitizado
   */
  sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  },

  /**
   * Valida se um nome contém apenas letras e espaços
   * @param name - Nome a ser validado
   * @returns true se o nome é válido, false caso contrário
   */
  isValidName(name: string): boolean {
    return /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
  },

  /**
   * Valida se um UUID é válido
   * @param id - UUID a ser validado
   * @returns true se o UUID é válido, false caso contrário
   */
  isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  },

  /**
   * Valida força de senha
   * @param password - Senha a ser validada
   * @returns Array de erros (vazio se senha válida)
   */
  validatePasswordStrength(password: string): string[] {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("mínimo 8 caracteres");
    }

    if (password.length > 100) {
      errors.push("máximo 100 caracteres");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("uma letra maiúscula");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("uma letra minúscula");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("um número");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("um caractere especial (!@#$%...)");
    }

    const commonPasswords = [
      "password",
      "12345678",
      "password1",
      "password123",
      "password456",
      "qwerty123",
      "abc12345",
    ];
    if (commonPasswords.some((weak) => password.toLowerCase().includes(weak))) {
      errors.push("senha muito comum");
    }

    return errors;
  },
};
