import { GetCurrentUserUseCase } from '@/use-cases/auth/get-current-user/get-current-user.use-case'
import { LoginUseCase } from '@/use-cases/auth/login/login.use-case'
import { RefreshTokenUseCase } from '@/use-cases/auth/refresh-token/refresh-token.use-case'
import { repositories } from './repositories'

export function createAuthUseCases() {
	return {
		login: new LoginUseCase(repositories.userRepository),
		refreshToken: new RefreshTokenUseCase(repositories.userRepository),
		getCurrentUser: new GetCurrentUserUseCase(repositories.userRepository),
	}
}
