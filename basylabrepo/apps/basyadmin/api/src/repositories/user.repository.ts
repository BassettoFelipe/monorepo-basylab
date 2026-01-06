import { eq } from 'drizzle-orm'
import { db } from '../db'
import { type NewUser, type User, users } from '../db/schema'

export const UserRepository = {
	async findById(id: string): Promise<User | undefined> {
		return db.query.users.findFirst({
			where: eq(users.id, id),
		})
	},

	async findByEmail(email: string): Promise<User | undefined> {
		return db.query.users.findFirst({
			where: eq(users.email, email),
		})
	},

	async findAll(): Promise<User[]> {
		return db.query.users.findMany({
			orderBy: (users, { desc }) => [desc(users.createdAt)],
		})
	},

	async findManagers(): Promise<User[]> {
		return db.query.users.findMany({
			where: eq(users.role, 'manager'),
			orderBy: (users, { desc }) => [desc(users.createdAt)],
		})
	},

	async create(data: NewUser): Promise<User> {
		const [user] = await db.insert(users).values(data).returning()
		return user
	},

	async update(id: string, data: Partial<NewUser>): Promise<User> {
		const [user] = await db
			.update(users)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(users.id, id))
			.returning()
		return user
	},

	async delete(id: string): Promise<void> {
		await db.delete(users).where(eq(users.id, id))
	},
}
