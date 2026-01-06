import type { IImageProcessorService } from './contracts/image-processor.interface'

/**
 * Image Processor Service
 *
 * Lazy-loaded getter for the configured image processor.
 * To change the image processor provider, update the configuration in services/container.ts
 */

let _imageProcessor: IImageProcessorService | null = null

export function getImageProcessor(): IImageProcessorService {
	if (!_imageProcessor) {
		const { getImageProcessor: getFromContainer } = require('@/services/container')
		_imageProcessor = getFromContainer()
	}
	return _imageProcessor as IImageProcessorService
}

export const imageProcessor = new Proxy({} as IImageProcessorService, {
	get(_target, prop: string | symbol): unknown {
		const service = getImageProcessor()
		const value = service[prop as keyof IImageProcessorService]
		return typeof value === 'function'
			? (value as (...args: never[]) => unknown).bind(service)
			: value
	},
})

export type {
	IImageProcessorService,
	ImageProcessorOptions,
	ImageValidationResult,
	ProcessedImage,
} from './contracts/image-processor.interface'
