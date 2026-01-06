import type { PgColumn } from 'drizzle-orm/pg-core'
import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		email: text('email').notNull().unique(),
		password: text('password'),
		name: text('name').notNull(),
		role: text('role').notNull().default('owner'),
		phone: text('phone'),
		avatarUrl: text('avatar_url'),
		companyId: uuid('company_id').references(() => companies.id, {
			onDelete: 'cascade',
		}),
		createdBy: uuid('created_by').references((): PgColumn => users.id, {
			onDelete: 'set null',
		}),
		isActive: boolean('is_active').default(true).notNull(),
		isEmailVerified: boolean('is_email_verified').default(false).notNull(),
		verificationSecret: text('verification_secret'),
		verificationExpiresAt: timestamp('verification_expires_at'),
		verificationAttempts: integer('verification_attempts').default(0).notNull(),
		verificationLastAttemptAt: timestamp('verification_last_attempt_at'),
		verificationResendCount: integer('verification_resend_count').default(0).notNull(),
		verificationLastResendAt: timestamp('verification_last_resend_at'),
		passwordResetSecret: text('password_reset_secret'),
		passwordResetExpiresAt: timestamp('password_reset_expires_at'),
		passwordResetResendCount: integer('password_reset_resend_count').default(0).notNull(),
		passwordResetCooldownEndsAt: timestamp('password_reset_cooldown_ends_at'),
		passwordResetResendBlocked: boolean('password_reset_resend_blocked').default(false).notNull(),
		passwordResetResendBlockedUntil: timestamp('password_reset_resend_blocked_until'),
		passwordResetAttempts: integer('password_reset_attempts').default(0).notNull(),
		passwordResetLastAttemptAt: timestamp('password_reset_last_attempt_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		companyIdIdx: index('users_company_id_idx').on(table.companyId),
	}),
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
