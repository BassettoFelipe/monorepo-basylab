import { Type } from '@sinclair/typebox'
import { USER_ROLES } from '@/types/roles'

export const ListUsersQuerySchema = Type.Object({
	role: Type.Optional(
		Type.Enum({
			broker: USER_ROLES.BROKER,
			manager: USER_ROLES.MANAGER,
			insurance_analyst: USER_ROLES.INSURANCE_ANALYST,
			all: 'all',
		}),
	),
	isActive: Type.Optional(Type.Boolean()),
	page: Type.Optional(
		Type.Number({
			minimum: 1,
			default: 1,
		}),
	),
	limit: Type.Optional(
		Type.Number({
			minimum: 1,
			maximum: 100,
			default: 20,
		}),
	),
})
