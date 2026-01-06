export const env = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	PORT: Number(process.env.PORT) || 3002,

	// Database
	DATABASE_URL: process.env.DATABASE_URL!,

	// JWT
	JWT_SECRET: process.env.JWT_SECRET!,
	JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
	JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

	// CORS
	CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3003',

	// Owner
	OWNER_EMAIL: process.env.OWNER_EMAIL || 'owner@basylab.com',
	OWNER_PASSWORD: process.env.OWNER_PASSWORD || 'owner123',
	OWNER_NAME: process.env.OWNER_NAME || 'Owner',

	isDev: process.env.NODE_ENV === 'development',
	isProd: process.env.NODE_ENV === 'production',
	isTest: process.env.NODE_ENV === 'test',
}
