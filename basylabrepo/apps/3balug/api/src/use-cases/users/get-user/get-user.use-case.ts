import type { User } from '@/db/schema/users'

type GetUserInput = {
	requestedBy: User
}

type GetUserOutput = {
	id: string
	email: string
	name: string
	createdAt: Date
}

export class GetUserUseCase {
	async execute(input: GetUserInput): Promise<GetUserOutput> {
		const user = input.requestedBy

		return {
			id: user.id,
			email: user.email,
			name: user.name,
			createdAt: user.createdAt,
		}
	}
}
