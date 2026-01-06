export interface PasswordRequirement {
	label: string
	test: (password: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
	{ label: 'Mínimo de 8 caracteres', test: (p: string) => p.length >= 8 },
	{ label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
	{ label: 'Uma letra minúscula', test: (p: string) => /[a-z]/.test(p) },
	{ label: 'Um número', test: (p: string) => /[0-9]/.test(p) },
	{
		label: 'Um caractere especial (!@#$%^&*)',
		test: (p: string) => /[^a-zA-Z0-9]/.test(p),
	},
]

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong'

export interface PasswordStrength {
	score: number
	label: string
	color: PasswordStrengthLevel
}

export function calculatePasswordStrength(password: string): PasswordStrength {
	const checks = [
		password.length >= 8,
		password.length >= 12,
		/[a-z]/.test(password),
		/[A-Z]/.test(password),
		/[0-9]/.test(password),
		/[^a-zA-Z0-9]/.test(password),
	]

	const score = checks.filter(Boolean).length

	if (score <= 2) return { score, label: 'Fraca', color: 'weak' }
	if (score <= 4) return { score, label: 'Média', color: 'medium' }
	return { score, label: 'Forte', color: 'strong' }
}
