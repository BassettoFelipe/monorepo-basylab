import { emailLayout } from "./email-layout.template";

interface PasswordResetTemplateProps {
  name: string;
  code: string;
  expirationMinutes: number;
}

export function passwordResetTemplate({
  name,
  code,
  expirationMinutes,
}: PasswordResetTemplateProps): string {
  const content = `
    <p style="margin: 0 0 24px; color: #434D00; font-size: 16px; line-height: 1.6;">
      Olá, <strong>${name}</strong>
    </p>

    <p style="margin: 0 0 32px; color: #4a4e2e; font-size: 15px; line-height: 1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para criar uma nova senha:
    </p>

    <!-- Code -->
    <div style="background-color: #fafaf7; border: 1px solid #e8e8e0; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 32px;">
      <div class="otp-code" style="font-size: 32px; font-weight: 700; color: #434D00; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
        ${code}
      </div>
      <p style="margin: 16px 0 0; color: #6b6f4a; font-size: 13px;">
        Válido por ${expirationMinutes} minutos
      </p>
    </div>

    <p style="margin: 0 0 24px; color: #6b6f4a; font-size: 14px; line-height: 1.6;">
      <strong>⚠️ Importante:</strong> Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá a mesma.
    </p>

    <p style="margin: 0; color: #434D00; font-size: 14px;">
      Equipe 3Balug
    </p>
  `;

  return emailLayout({
    content,
    previewText: `Código de redefinição de senha: ${code}`,
  });
}
