import sharp from 'sharp'
import { logger } from '@/config/logger'
import type {
	DocumentImageOptions,
	IImageProcessorService,
	ImageProcessorOptions,
	ImageValidationResult,
	ProcessedImage,
} from '../../contracts/image-processor.interface'

const DEFAULT_AVATAR_OPTIONS: ImageProcessorOptions = {
	maxWidth: 256,
	maxHeight: 256,
	quality: 80,
	format: 'webp',
}

const DEFAULT_DOCUMENT_OPTIONS: DocumentImageOptions = {
	maxWidth: 1920,
	maxHeight: 2560,
	quality: 75,
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export class SharpImageProcessor implements IImageProcessorService {
	/**
	 * Processa uma imagem de avatar: redimensiona, comprime e converte para WebP
	 */
	async processAvatar(
		buffer: Buffer,
		options: ImageProcessorOptions = {},
	): Promise<ProcessedImage> {
		const opts = { ...DEFAULT_AVATAR_OPTIONS, ...options }
		const originalSize = buffer.length

		if (originalSize > MAX_IMAGE_SIZE) {
			const sizeMB = (originalSize / 1024 / 1024).toFixed(2)
			const maxMB = (MAX_IMAGE_SIZE / 1024 / 1024).toFixed(0)
			throw new Error(`Imagem muito grande (${sizeMB}MB). Tamanho máximo permitido: ${maxMB}MB`)
		}

		try {
			// Usar rotate() sem argumentos para auto-rotacionar baseado em EXIF
			const image = sharp(buffer).rotate()
			const metadata = await sharp(buffer).metadata()

			// Redimensionar mantendo aspect ratio
			let processedImage = image.resize(opts.maxWidth, opts.maxHeight, {
				fit: 'cover',
				position: 'center',
				withoutEnlargement: true,
			})

			// Converter para o formato especificado com compressão
			let contentType: string
			switch (opts.format) {
				case 'webp':
					processedImage = processedImage.webp({
						quality: opts.quality,
						effort: 4, // Balanceamento entre velocidade e compressão
					})
					contentType = 'image/webp'
					break
				case 'jpeg':
					processedImage = processedImage.jpeg({
						quality: opts.quality,
						mozjpeg: true, // Melhor compressão
					})
					contentType = 'image/jpeg'
					break
				case 'png':
					processedImage = processedImage.png({
						compressionLevel: 9,
						adaptiveFiltering: true,
					})
					contentType = 'image/png'
					break
				default:
					processedImage = processedImage.webp({ quality: opts.quality })
					contentType = 'image/webp'
			}

			const outputBuffer = await processedImage.toBuffer()
			const outputMetadata = await sharp(outputBuffer).metadata()

			const processedSize = outputBuffer.length
			const compressionRatio =
				originalSize > 0 ? Math.round((1 - processedSize / originalSize) * 100) : 0

			logger.info(
				{
					originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
					processedSize: `${(processedSize / 1024).toFixed(2)}KB`,
					compressionRatio: `${compressionRatio}%`,
					originalFormat: metadata.format,
					outputFormat: opts.format,
					dimensions: `${outputMetadata.width}x${outputMetadata.height}`,
				},
				'Imagem processada com sucesso',
			)

			return {
				buffer: outputBuffer,
				contentType,
				width: outputMetadata.width ?? opts.maxWidth ?? 256,
				height: outputMetadata.height ?? opts.maxHeight ?? 256,
				originalSize,
				processedSize,
				compressionRatio,
			}
		} catch (error) {
			logger.error({ err: error }, 'Erro ao processar imagem')
			throw error
		}
	}

	/**
	 * Processa uma imagem de documento: comprime mantendo boa qualidade para leitura
	 * Documentos precisam manter legibilidade, entao usamos configuracoes mais conservadoras
	 */
	async processDocumentImage(
		buffer: Buffer,
		options: DocumentImageOptions = {},
	): Promise<ProcessedImage> {
		const opts = { ...DEFAULT_DOCUMENT_OPTIONS, ...options }
		const originalSize = buffer.length

		if (originalSize > MAX_IMAGE_SIZE) {
			const sizeMB = (originalSize / 1024 / 1024).toFixed(2)
			const maxMB = (MAX_IMAGE_SIZE / 1024 / 1024).toFixed(0)
			throw new Error(`Imagem muito grande (${sizeMB}MB). Tamanho maximo permitido: ${maxMB}MB`)
		}

		try {
			const image = sharp(buffer).rotate()
			const metadata = await sharp(buffer).metadata()

			if (!metadata.width || !metadata.height) {
				throw new Error('Nao foi possivel obter as dimensoes da imagem')
			}

			// Redimensionar apenas se necessario (manter dentro dos limites)
			let processedImage = image.resize(opts.maxWidth, opts.maxHeight, {
				fit: 'inside',
				withoutEnlargement: true,
			})

			// Converter para WebP com boa qualidade para documentos
			processedImage = processedImage.webp({
				quality: opts.quality,
				effort: 4,
				lossless: false,
			})

			const outputBuffer = await processedImage.toBuffer()
			const outputMetadata = await sharp(outputBuffer).metadata()

			const processedSize = outputBuffer.length
			const compressionRatio =
				originalSize > 0 ? Math.round((1 - processedSize / originalSize) * 100) : 0

			logger.info(
				{
					originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
					processedSize: `${(processedSize / 1024).toFixed(2)}KB`,
					compressionRatio: `${compressionRatio}%`,
					originalFormat: metadata.format,
					outputFormat: 'webp',
					dimensions: `${outputMetadata.width}x${outputMetadata.height}`,
				},
				'Imagem de documento processada com sucesso',
			)

			return {
				buffer: outputBuffer,
				contentType: 'image/webp',
				width: outputMetadata.width ?? metadata.width,
				height: outputMetadata.height ?? metadata.height,
				originalSize,
				processedSize,
				compressionRatio,
			}
		} catch (error) {
			logger.error({ err: error }, 'Erro ao processar imagem de documento')
			throw error
		}
	}

	/**
	 * Valida se o buffer é uma imagem válida
	 */
	async validateImage(buffer: Buffer): Promise<ImageValidationResult> {
		try {
			const metadata = await sharp(buffer).metadata()

			if (!metadata.format) {
				return { valid: false, error: 'Formato de imagem não reconhecido' }
			}

			const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']
			if (!allowedFormats.includes(metadata.format)) {
				return {
					valid: false,
					error: `Formato ${metadata.format} não é permitido`,
				}
			}

			return {
				valid: true,
				format: metadata.format,
				width: metadata.width,
				height: metadata.height,
			}
		} catch {
			return { valid: false, error: 'Arquivo não é uma imagem válida' }
		}
	}
}
