import type { IStorageService } from '@/services/storage'

interface DeleteFileInput {
	key: string
	userId: string
}

export class DeleteFileUseCase {
	constructor(private storageService: IStorageService) {}

	async execute(input: DeleteFileInput): Promise<void> {
		const { key, userId } = input

		if (!key.includes(`files/${userId}/`)) {
			throw new Error('Você não tem permissão para excluir este arquivo')
		}

		const exists = await this.storageService.exists(key)
		if (!exists) {
			throw new Error('Arquivo não encontrado')
		}

		await this.storageService.delete(key)
	}
}
