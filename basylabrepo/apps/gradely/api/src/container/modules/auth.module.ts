import { GetMeUseCase } from '@/use-cases/auth/get-me/get-me.use-case'
import { LoginUseCase } from '@/use-cases/auth/login/login.use-case'
import { LogoutUseCase } from '@/use-cases/auth/logout/logout.use-case'
import { RefreshTokenUseCase } from '@/use-cases/auth/refresh-token/refresh-token.use-case'
import { repositories } from './repositories'

export function createAuthUseCases() {
	return {
		login: new LoginUseCase(repositories.userRepository),
		refreshToken: new RefreshTokenUseCase(repositories.userRepository),
		getMe: new GetMeUseCase(repositories.userRepository),
		logout: new LogoutUseCase(),
	}
}

export type AuthUseCases = ReturnType<typeof createAuthUseCases>
