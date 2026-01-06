import { Client } from 'minio'
import { Constants } from '@/config/constants'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import type {
	IStorageService,
	PresignedUrlResult,
	UploadResult,
} from '../../contracts/storage.interface'

export class MinioStorageProvider implements IStorageService {
	private client: Client
	private presignClient: Client // Cliente separado para gerar URLs presignadas
	private bucket: string
	private publicEndpoint: string
	private bucketInitialized = false

	constructor() {
		this.bucket = env.MINIO_BUCKET

		// Cliente interno para operações diretas (upload, delete, etc)
		this.client = new Client({
			endPoint: env.MINIO_ENDPOINT,
			port: env.MINIO_PORT,
			useSSL: env.MINIO_USE_SSL,
			accessKey: env.MINIO_ACCESS_KEY,
			secretKey: env.MINIO_SECRET_KEY,
		})

		// URL pública para acessar os arquivos
		// Se MINIO_PUBLIC_URL estiver definida, usa ela (para produção/homolog com proxy reverso)
		// Caso contrário, constrói a URL baseada no endpoint interno
		if (env.MINIO_PUBLIC_URL) {
			this.publicEndpoint = env.MINIO_PUBLIC_URL

			// Cliente para gerar URLs presignadas usando o endpoint público
			// Isso é necessário porque a assinatura AWS v4 inclui o host no cálculo
			const publicUrl = new URL(env.MINIO_PUBLIC_URL)
			this.presignClient = new Client({
				endPoint: publicUrl.hostname,
				port: publicUrl.port
					? Number.parseInt(publicUrl.port, 10)
					: publicUrl.protocol === 'https:'
						? 443
						: 80,
				useSSL: publicUrl.protocol === 'https:',
				accessKey: env.MINIO_ACCESS_KEY,
				secretKey: env.MINIO_SECRET_KEY,
			})
		} else {
			const protocol = env.MINIO_USE_SSL ? 'https' : 'http'
			this.publicEndpoint = `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`
			this.presignClient = this.client
		}
	}

	private async ensureBucket(): Promise<void> {
		if (this.bucketInitialized) {
			return
		}

		try {
			const exists = await this.client.bucketExists(this.bucket)
			if (!exists) {
				await this.client.makeBucket(this.bucket)
				logger.info({ bucket: this.bucket }, 'Bucket criado com sucesso')

				// Configurar política de acesso público para leitura
				const policy = {
					Version: '2012-10-17',
					Statement: [
						{
							Effect: 'Allow',
							Principal: { AWS: ['*'] },
							Action: ['s3:GetObject'],
							Resource: [`arn:aws:s3:::${this.bucket}/*`],
						},
					],
				}

				await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy))
				logger.info({ bucket: this.bucket }, 'Política de acesso público configurada')
			}
			this.bucketInitialized = true
		} catch (error) {
			logger.error({ err: error, bucket: this.bucket }, 'Erro ao inicializar bucket')
			throw error
		}
	}

	private withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
		return Promise.race([
			promise,
			new Promise<T>((_, reject) =>
				setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs),
			),
		])
	}

	async upload(file: Buffer, key: string, contentType: string): Promise<UploadResult> {
		await this.ensureBucket()

		await this.withTimeout(
			this.client.putObject(this.bucket, key, file, file.length, {
				'Content-Type': contentType,
			}),
			Constants.TIMEOUTS.STORAGE_UPLOAD_MS,
			'Upload',
		)

		logger.info({ key, bucket: this.bucket, size: file.length }, 'Arquivo enviado com sucesso')

		return {
			key,
			url: this.getPublicUrl(key),
			bucket: this.bucket,
			size: file.length,
			contentType,
		}
	}

	async delete(key: string): Promise<void> {
		await this.ensureBucket()

		await this.withTimeout(
			this.client.removeObject(this.bucket, key),
			Constants.TIMEOUTS.STORAGE_DELETE_MS,
			'Delete',
		)
		logger.info({ key, bucket: this.bucket }, 'Arquivo removido com sucesso')
	}

	getPublicUrl(key: string): string {
		return `${this.publicEndpoint}/${this.bucket}/${key}`
	}

	async exists(key: string): Promise<boolean> {
		try {
			await this.client.statObject(this.bucket, key)
			return true
		} catch {
			return false
		}
	}

	async getPresignedUploadUrl(
		key: string,
		contentType: string,
		expiresInSeconds = 300,
	): Promise<PresignedUrlResult> {
		await this.ensureBucket()

		// Usar presignClient para gerar URL com assinatura correta para o endpoint público
		const url = await this.presignClient.presignedPutObject(this.bucket, key, expiresInSeconds)

		const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

		logger.info(
			{ key, bucket: this.bucket, expiresInSeconds, contentType },
			'URL pré-assinada gerada para upload',
		)

		return {
			url,
			key,
			expiresAt,
		}
	}

	async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<PresignedUrlResult> {
		await this.ensureBucket()

		// Usar presignClient para gerar URL com assinatura correta para o endpoint público
		const url = await this.presignClient.presignedGetObject(this.bucket, key, expiresInSeconds)

		const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

		logger.info(
			{ key, bucket: this.bucket, expiresInSeconds },
			'URL pré-assinada gerada para download',
		)

		return {
			url,
			key,
			expiresAt,
		}
	}
}
