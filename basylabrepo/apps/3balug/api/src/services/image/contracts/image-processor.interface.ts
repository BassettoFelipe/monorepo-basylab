export interface ProcessedImage {
	buffer: Buffer
	contentType: string
	width: number
	height: number
	originalSize: number
	processedSize: number
	compressionRatio: number
}

export interface ImageProcessorOptions {
	maxWidth?: number
	maxHeight?: number
	quality?: number
	format?: 'jpeg' | 'webp' | 'png'
}

export interface ImageValidationResult {
	valid: boolean
	format?: string
	width?: number
	height?: number
	error?: string
}

export interface DocumentImageOptions {
	maxWidth?: number
	maxHeight?: number
	quality?: number
}

export interface IImageProcessorService {
	processAvatar(buffer: Buffer, options?: ImageProcessorOptions): Promise<ProcessedImage>
	processDocumentImage(buffer: Buffer, options?: DocumentImageOptions): Promise<ProcessedImage>
	validateImage(buffer: Buffer): Promise<ImageValidationResult>
}
