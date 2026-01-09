import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student', 'guardian'])

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		email: text('email').notNull().unique(),
		password: text('password'),
		name: text('name').notNull(),
		role: userRoleEnum('role').notNull().default('student'),
		phone: text('phone'),
		avatarUrl: text('avatar_url'),

		// Status
		isActive: boolean('is_active').default(true).notNull(),
		isEmailVerified: boolean('is_email_verified').default(false).notNull(),

		// Email verification
		verificationSecret: text('verification_secret'),
		verificationExpiresAt: timestamp('verification_expires_at'),
		verificationAttempts: integer('verification_attempts').default(0).notNull(),
		verificationLastAttemptAt: timestamp('verification_last_attempt_at'),
		verificationResendCount: integer('verification_resend_count').default(0).notNull(),
		verificationLastResendAt: timestamp('verification_last_resend_at'),

		// Password reset
		passwordResetSecret: text('password_reset_secret'),
		passwordResetExpiresAt: timestamp('password_reset_expires_at'),
		passwordResetAttempts: integer('password_reset_attempts').default(0).notNull(),
		passwordResetLastAttemptAt: timestamp('password_reset_last_attempt_at'),
		passwordResetResendCount: integer('password_reset_resend_count').default(0).notNull(),
		passwordResetCooldownEndsAt: timestamp('password_reset_cooldown_ends_at'),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [index('users_email_idx').on(table.email), index('users_role_idx').on(table.role)],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserRole = 'admin' | 'teacher' | 'student' | 'guardian'
