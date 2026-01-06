import { emailLayout } from './email-layout.template'

interface UserInvitationTemplateProps {
	name: string
	email: string
	companyName: string
	role: string
	invitedBy: string
	resetPasswordUrl: string
}

const roleNames: Record<string, string> = {
	broker: 'Corretor',
	manager: 'Gerente',
	insurance_analyst: 'Analista de Seguros',
	owner: 'Proprietário',
	admin: 'Administrador',
}

export function userInvitationTemplate({
	name,
	email,
	companyName,
	role,
	invitedBy,
	resetPasswordUrl,
}: UserInvitationTemplateProps): string {
	const roleName = roleNames[role] || role

	const content = `
    <p style="margin: 0 0 16px; color: #434D00; font-size: 16px; line-height: 1.5;">
      Olá, <strong>${name}</strong>
    </p>

    <p style="margin: 0 0 24px; color: #4a4e2e; font-size: 14px; line-height: 1.6;">
      Você foi convidado por <strong>${invitedBy}</strong> para fazer parte da equipe da <strong>${companyName}</strong> na plataforma 3Balug como <strong>${roleName}</strong>.
    </p>

    <!-- Credentials Box -->
    <div style="background-color: #fafaf7; border: 1px solid #e8e8e0; border-radius: 6px; padding: 16px; margin: 0 0 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            <p style="margin: 0 0 4px; color: #6b6f4a; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              E-mail de acesso
            </p>
            <p style="margin: 0; color: #434D00; font-size: 14px; font-family: 'Courier New', Courier, monospace;">
              ${email}
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin: 0 0 4px; color: #6b6f4a; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              Cargo
            </p>
            <p style="margin: 0; color: #434D00; font-size: 14px;">
              ${roleName}
            </p>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 20px; color: #4a4e2e; font-size: 14px; line-height: 1.6;">
      Para acessar a plataforma, você precisa definir sua senha:
    </p>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px;">
      <tr>
        <td style="text-align: center;">
          <a href="${resetPasswordUrl}" style="display: inline-block; background-color: #434D00; color: #E6FF4B; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Definir Minha Senha
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px; color: #6b6f4a; font-size: 12px; line-height: 1.5;">
      Ou copie e cole o link no seu navegador:
    </p>
    <p style="margin: 0 0 24px; color: #434D00; font-size: 11px; word-break: break-all; font-family: 'Courier New', Courier, monospace; background-color: #fafaf7; padding: 8px; border-radius: 4px;">
      ${resetPasswordUrl}
    </p>

    <p style="margin: 0; color: #434D00; font-size: 13px; line-height: 1.6;">
      Bem-vindo à equipe!<br>
      <span style="color: #6b6f4a;">Equipe 3Balug</span>
    </p>
  `

	return emailLayout({
		content,
		previewText: `Você foi convidado para ${companyName} - Defina sua senha`,
	})
}
