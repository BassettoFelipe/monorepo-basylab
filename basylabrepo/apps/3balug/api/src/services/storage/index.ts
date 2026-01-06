import type { IStorageService } from './contracts/storage.interface'

/**
 * Storage Service
 *
 * Lazy-loaded getter for the configured storage service.
 * To change the storage provider, update the configuration in services/container.ts
 */

let _storageService: IStorageService | null = null

export function getStorageService(): IStorageService {
	if (!_storageService) {
		const { getStorageService: getFromContainer } = require('@/services/container')
		_storageService = getFromContainer()
	}
	return _storageService as IStorageService
}

export const storageService = new Proxy({} as IStorageService, {
	get(_target, prop: string | symbol): unknown {
		const service = getStorageService()
		const value = service[prop as keyof IStorageService]
		return typeof value === 'function'
			? (value as (...args: never[]) => unknown).bind(service)
			: value
	},
})

export type {
	IStorageService,
	PresignedUrlResult,
	UploadResult,
} from './contracts/storage.interface'
