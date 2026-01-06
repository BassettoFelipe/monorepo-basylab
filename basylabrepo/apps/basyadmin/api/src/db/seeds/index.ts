import { PasswordUtils } from '@basylab/core/crypto'
import { eq } from 'drizzle-orm'
import { env } from '../../config'
import { db } from '../connection'
import { users } from '../schema'

async function seed() {
	console.log('Seeding database...')

	// Check if owner already exists
	const existingOwner = await db.query.users.findFirst({
		where: eq(users.email, env.OWNER_EMAIL),
	})

	if (existingOwner) {
		console.log('Owner already exists, skipping...')
		return
	}

	// Create owner
	const passwordHash = await PasswordUtils.hash(env.OWNER_PASSWORD)

	await db.insert(users).values({
		email: env.OWNER_EMAIL,
		passwordHash,
		name: env.OWNER_NAME,
		role: 'owner',
		isActive: true,
	})

	console.log(`Owner created: ${env.OWNER_EMAIL}`)
	console.log('Seeding completed!')
}

seed()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Seed failed:', error)
		process.exit(1)
	})
