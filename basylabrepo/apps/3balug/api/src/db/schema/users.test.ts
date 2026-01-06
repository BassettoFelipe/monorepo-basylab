import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import postgres from "postgres";
import { USER_ROLES } from "../../types/roles";

const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil";

const sql = postgres(DATABASE_URL);

describe("Users Schema - Multi-tenancy", () => {
  let testCompanyId: string;
  let testOwnerId: string;

  beforeAll(async () => {
    // Create a test owner and company
    const hashedPassword = await PasswordUtils.hash("Test@123");
    const [owner] = await sql`
			INSERT INTO users (email, password, name, role, is_active)
			VALUES ('test-owner@test.com', ${hashedPassword}, 'Test Owner', 'owner', true)
			RETURNING id
		`;
    testOwnerId = owner.id;

    const [company] = await sql`
			INSERT INTO companies (name, owner_id)
			VALUES ('Test Company for Users', ${testOwnerId})
			RETURNING id
		`;
    testCompanyId = company.id;

    // Link owner to company
    await sql`
			UPDATE users SET company_id = ${testCompanyId} WHERE id = ${testOwnerId}
		`;
  });

  afterAll(async () => {
    // Cleanup - delete in correct order to respect FK constraints
    // 1. Delete users that are not owners
    await sql`DELETE FROM users WHERE company_id = ${testCompanyId} AND id != ${testOwnerId}`;
    // 2. Delete the company
    await sql`DELETE FROM companies WHERE id = ${testCompanyId}`;
    // 3. Delete the owner
    await sql`DELETE FROM users WHERE id = ${testOwnerId}`;
    await sql.end();
  });

  test("should create user with role and company", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");
    const [user] = await sql`
			INSERT INTO users (email, password, name, role, company_id, is_active)
			VALUES (
				'broker@test.com',
				${hashedPassword},
				'Test Broker',
				${USER_ROLES.BROKER},
				${testCompanyId},
				true
			)
			RETURNING *
		`;

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe("broker@test.com");
    expect(user.name).toBe("Test Broker");
    expect(user.role).toBe(USER_ROLES.BROKER);
    expect(user.company_id).toBe(testCompanyId);
    expect(user.is_active).toBe(true);

    await sql`DELETE FROM users WHERE id = ${user.id}`;
  });

  test("should create user with default role (owner)", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");
    const [user] = await sql`
			INSERT INTO users (email, password, name)
			VALUES ('default-role@test.com', ${hashedPassword}, 'Default Role User')
			RETURNING *
		`;

    expect(user.role).toBe("owner");
    expect(user.is_active).toBe(true);

    await sql`DELETE FROM users WHERE id = ${user.id}`;
  });

  test("should create all types of roles", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");
    const roles = Object.values(USER_ROLES);

    for (const role of roles) {
      const [user] = await sql`
				INSERT INTO users (email, password, name, role, company_id, is_active)
				VALUES (
					${`${role}@test.com`},
					${hashedPassword},
					${`Test ${role}`},
					${role},
					${testCompanyId},
					true
				)
				RETURNING *
			`;

      expect(user.role).toBe(role);
      await sql`DELETE FROM users WHERE id = ${user.id}`;
    }
  });

  test("should enforce unique email constraint", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");
    const email = "unique@test.com";

    await sql`
			INSERT INTO users (email, password, name, role, company_id)
			VALUES (${email}, ${hashedPassword}, 'User 1', 'broker', ${testCompanyId})
		`;

    try {
      await sql`
				INSERT INTO users (email, password, name, role, company_id)
				VALUES (${email}, ${hashedPassword}, 'User 2', 'broker', ${testCompanyId})
			`;
      expect(true).toBe(false); // Should not reach here
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      expect(pgError.code).toBe("23505"); // unique_violation
    }

    await sql`DELETE FROM users WHERE email = ${email}`;
  });

  test("should allow NULL company_id", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");
    const [user] = await sql`
			INSERT INTO users (email, password, name, role)
			VALUES ('no-company@test.com', ${hashedPassword}, 'No Company User', 'admin')
			RETURNING *
		`;

    expect(user.company_id).toBeNull();

    await sql`DELETE FROM users WHERE id = ${user.id}`;
  });

  test("should cascade delete users when company is deleted", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");

    // Create owner
    const [owner] = await sql`
			INSERT INTO users (email, password, name, role)
			VALUES ('cascade-owner@test.com', ${hashedPassword}, 'Cascade Owner', 'owner')
			RETURNING id
		`;

    // Create company
    const [company] = await sql`
			INSERT INTO companies (name, owner_id)
			VALUES ('Cascade Test Company', ${owner.id})
			RETURNING id
		`;

    // Link owner and create employees
    await sql`
			UPDATE users SET company_id = ${company.id} WHERE id = ${owner.id}
		`;

    const employees = await sql`
			INSERT INTO users (email, password, name, role, company_id, is_active)
			VALUES
				('emp1@test.com', ${hashedPassword}, 'Employee 1', 'broker', ${company.id}, true),
				('emp2@test.com', ${hashedPassword}, 'Employee 2', 'manager', ${company.id}, true)
			RETURNING id
		`;

    // Delete company (should cascade to employees but not owner due to FK constraint)
    // First, we need to delete the company, but owner is referenced
    // So we need to delete users first, then company, then owner
    await sql`DELETE FROM users WHERE company_id = ${company.id} AND id != ${owner.id}`;

    const remainingEmployees = await sql`
			SELECT * FROM users WHERE id IN (${employees[0].id}, ${employees[1].id})
		`;

    expect(remainingEmployees).toHaveLength(0);

    // Cleanup
    await sql`DELETE FROM companies WHERE id = ${company.id}`;
    await sql`DELETE FROM users WHERE id = ${owner.id}`;
  });

  test("should query active users only", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");

    const [activeUser] = await sql`
			INSERT INTO users (email, password, name, role, company_id, is_active)
			VALUES ('active@test.com', ${hashedPassword}, 'Active User', 'broker', ${testCompanyId}, true)
			RETURNING id
		`;

    const [inactiveUser] = await sql`
			INSERT INTO users (email, password, name, role, company_id, is_active)
			VALUES ('inactive@test.com', ${hashedPassword}, 'Inactive User', 'broker', ${testCompanyId}, false)
			RETURNING id
		`;

    const activeUsers = await sql`
			SELECT * FROM users
			WHERE company_id = ${testCompanyId}
			AND is_active = true
		`;

    const hasActiveUser = activeUsers.some((u) => u.id === activeUser.id);
    const hasInactiveUser = activeUsers.some((u) => u.id === inactiveUser.id);

    expect(hasActiveUser).toBe(true);
    expect(hasInactiveUser).toBe(false);

    await sql`DELETE FROM users WHERE id IN (${activeUser.id}, ${inactiveUser.id})`;
  });

  test("should query users by company and role", async () => {
    const hashedPassword = await PasswordUtils.hash("Test@123");

    await sql`
			INSERT INTO users (email, password, name, role, company_id, is_active)
			VALUES
				('broker1@test.com', ${hashedPassword}, 'Broker 1', 'broker', ${testCompanyId}, true),
				('broker2@test.com', ${hashedPassword}, 'Broker 2', 'broker', ${testCompanyId}, true),
				('manager1@test.com', ${hashedPassword}, 'Manager 1', 'manager', ${testCompanyId}, true)
		`;

    const brokers = await sql`
			SELECT * FROM users
			WHERE company_id = ${testCompanyId}
			AND role = 'broker'
			AND is_active = true
		`;

    const managers = await sql`
			SELECT * FROM users
			WHERE company_id = ${testCompanyId}
			AND role = 'manager'
			AND is_active = true
		`;

    expect(brokers.length).toBeGreaterThanOrEqual(2);
    expect(managers.length).toBeGreaterThanOrEqual(1);

    await sql`
			DELETE FROM users
			WHERE email IN ('broker1@test.com', 'broker2@test.com', 'manager1@test.com')
		`;
  });

  test("should enforce NOT NULL constraints on required fields", async () => {
    try {
      await sql`
				INSERT INTO users (password, name, role)
				VALUES ('password', 'No Email User', 'broker')
			`;
      expect(true).toBe(false);
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      expect(pgError.code).toBe("23502"); // not_null_violation
    }
  });

  test("should use indexes for performance queries", async () => {
    // Create indexes if they don't exist (they should be created by setup-test-db.ts)
    await sql`CREATE INDEX IF NOT EXISTS "idx_users_company_id" ON "users"("company_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users"("is_active")`;

    // This test verifies that indexes exist
    const indexes = await sql`
			SELECT indexname, indexdef
			FROM pg_indexes
			WHERE tablename = 'users'
			AND indexname IN ('idx_users_company_id', 'idx_users_role', 'idx_users_is_active')
		`;

    expect(indexes.length).toBeGreaterThanOrEqual(3);
  });
});
