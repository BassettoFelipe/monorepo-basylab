import { UserNotFoundError } from '@basylab/core/errors'
import type { IUserRepository, UserProfile } from '@/repositories/contracts/user.repository'

type GetMeInput = {
	userId: string
}

type GetMeOutput = UserProfile

export class GetMeUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: GetMeInput): Promise<GetMeOutput> {
		const user = await this.userRepository.findByIdForProfile(input.userId)

		if (!user) {
			throw new UserNotFoundError()
		}

		return user
	}
}
