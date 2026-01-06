import { EmailNotVerifiedError, UserNotFoundError } from "@basylab/core/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";

export interface ValidateEmailForResetInput {
  email: string;
}

export interface ValidateEmailForResetOutput {
  email: string;
  name: string;
}

export class ValidateEmailForResetUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ValidateEmailForResetInput): Promise<ValidateEmailForResetOutput> {
    const { email } = input;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UserNotFoundError("Email não encontrado. Verifique o email informado.");
    }

    // Usuários criados por admin (sem senha) já têm email verificado
    // Usuários normais precisam verificar email antes de resetar senha
    if (!user.isEmailVerified && user.password !== null) {
      throw new EmailNotVerifiedError(
        "Email não verificado. Por favor, verifique seu email primeiro.",
      );
    }

    return {
      email: user.email,
      name: user.name,
    };
  }
}
