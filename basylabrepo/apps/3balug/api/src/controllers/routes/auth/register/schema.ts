import { t } from 'elysia'

export const registerBodySchema = t.Object({
	email: t.String({ format: 'email' }),
	password: t.String({
		minLength: 8,
		pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,}$',
		error:
			'A senha deve conter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial',
	}),
	name: t.String({ minLength: 2 }),
	companyName: t.String({ minLength: 2, maxLength: 100 }),
	planId: t.String(),
})

export const registerResponseSchema = {
	201: t.Object({
		success: t.Literal(true),
		message: t.String(),
		data: t.Object({
			user: t.Object({
				email: t.String(),
				name: t.String(),
			}),
		}),
	}),
}
