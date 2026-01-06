import { beforeEach, describe, expect, test } from "bun:test";
import type { Company } from "@/db/schema/companies";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError, NotFoundError, UnauthorizedError } from "@/errors";
import type { IUserCacheService } from "@/services/contracts/user-cache-service.interface";
import { InMemoryCompanyRepository, InMemoryUserRepository } from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { CryptoUtils } from "@/utils/crypto.utils";
import { DeactivateUserUseCase } from "./deactivate-user.use-case";

// Mock do UserCacheService
const mockUserCacheService: IUserCacheService = {
  get: async () => null,
  set: async () => {},
  invalidate: async () => {},
  invalidateMany: async () => {},
  invalidateAll: async () => {},
  getStats: async () => ({ totalKeys: 0, memoryUsage: "0B" }),
};

describe("DeactivateUserUseCase", () => {
  let useCase: DeactivateUserUseCase;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let company: Company;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    useCase = new DeactivateUserUseCase(userRepository, mockUserCacheService);

    ownerUser = await userRepository.create({
      email: "owner@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
      name: "Owner User",
      role: USER_ROLES.OWNER,
      isActive: true,
      isEmailVerified: true,
    });

    company = await companyRepository.create({
      name: "Test Company",
      ownerId: ownerUser.id,
      email: "owner@test.com",
    });

    ownerUser = (await userRepository.update(ownerUser.id, {
      companyId: company.id,
    })) as User;
  });

  describe("Validações de Permissão", () => {
    test("deve permitir apenas owner desativar usuários", async () => {
      const broker = await userRepository.create({
        email: "broker@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Broker User",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const targetUser = await userRepository.create({
        email: "target@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Target User",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          userId: targetUser.id,
          deactivatedBy: broker,
        }),
      ).rejects.toThrow(
        new UnauthorizedError(
          "Você não tem permissão para desativar usuários. Apenas proprietários e gerentes podem realizar esta ação.",
        ),
      );
    });

    test("deve lançar erro se owner não tem empresa", async () => {
      const orphanOwner = await userRepository.create({
        email: "orphan@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Orphan Owner",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          userId: "any-id",
          deactivatedBy: orphanOwner,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada"));
    });

    test("deve lançar erro se usuário não encontrado", async () => {
      await expect(
        useCase.execute({
          userId: "non-existent-id",
          deactivatedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Usuário não encontrado"));
    });

    test("deve lançar erro ao tentar desativar usuário de outra empresa", async () => {
      const owner2 = await userRepository.create({
        email: "owner2@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Owner 2",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      const company2 = await companyRepository.create({
        name: "Company 2",
        ownerId: owner2.id,
        email: "owner2@test.com",
      });

      await userRepository.update(owner2.id, { companyId: company2.id });

      const userCompany2 = await userRepository.create({
        email: "broker-company2@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Broker Company 2",
        role: USER_ROLES.BROKER,
        companyId: company2.id,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          userId: userCompany2.id,
          deactivatedBy: ownerUser,
        }),
      ).rejects.toThrow(new UnauthorizedError("Você não pode desativar usuários de outra empresa"));
    });

    test("deve lançar erro ao tentar desativar a si mesmo", async () => {
      await expect(
        useCase.execute({
          userId: ownerUser.id,
          deactivatedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não pode desativar sua própria conta"));
    });

    test("deve lançar erro ao tentar desativar usuário já desativado", async () => {
      const broker = await userRepository.create({
        email: "broker@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Broker User",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: false, // Já desativado
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          userId: broker.id,
          deactivatedBy: ownerUser,
        }),
      ).rejects.toThrow(new UnauthorizedError("Este usuário já está desativado"));
    });
  });

  describe("Desativação com Sucesso", () => {
    test("deve desativar broker com sucesso", async () => {
      const broker = await userRepository.create({
        email: "broker@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Broker User",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        userId: broker.id,
        deactivatedBy: ownerUser,
      });

      expect(result.id).toBe(broker.id);
      expect(result.email).toBe("broker@test.com");
      expect(result.name).toBe("Broker User");
      expect(result.isActive).toBe(false);
      expect(result.message).toBe("Usuário desativado com sucesso");

      // Verificar no repositório
      const updatedUser = await userRepository.findById(broker.id);
      expect(updatedUser?.isActive).toBe(false);
    });

    test("deve desativar manager com sucesso", async () => {
      const manager = await userRepository.create({
        email: "manager@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Manager User",
        role: USER_ROLES.MANAGER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        userId: manager.id,
        deactivatedBy: ownerUser,
      });

      expect(result.isActive).toBe(false);
    });

    test("deve desativar insurance analyst com sucesso", async () => {
      const analyst = await userRepository.create({
        email: "analyst@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Analyst User",
        role: USER_ROLES.INSURANCE_ANALYST,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        userId: analyst.id,
        deactivatedBy: ownerUser,
      });

      expect(result.isActive).toBe(false);
    });
  });

  describe("Soft Delete", () => {
    test("deve manter todos os dados do usuário (soft delete)", async () => {
      const broker = await userRepository.create({
        email: "broker@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Broker User",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const originalData = await userRepository.findById(broker.id);

      await useCase.execute({
        userId: broker.id,
        deactivatedBy: ownerUser,
      });

      const deactivatedUser = await userRepository.findById(broker.id);

      // Todos os dados devem ser mantidos
      expect(deactivatedUser).toBeDefined();
      expect(deactivatedUser?.email).toBe(originalData?.email);
      expect(deactivatedUser?.name).toBe(originalData?.name);
      expect(deactivatedUser?.role).toBe(originalData?.role);
      expect(deactivatedUser?.companyId).toBe(originalData?.companyId);
      // Apenas isActive muda
      expect(deactivatedUser?.isActive).toBe(false);
    });

    test("usuário desativado ainda pode ser encontrado por findById", async () => {
      const broker = await userRepository.create({
        email: "broker@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Broker User",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await useCase.execute({
        userId: broker.id,
        deactivatedBy: ownerUser,
      });

      const foundUser = await userRepository.findById(broker.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(broker.id);
    });

    test("usuário desativado ainda aparece em findByCompanyId", async () => {
      const broker = await userRepository.create({
        email: "broker@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Broker User",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await useCase.execute({
        userId: broker.id,
        deactivatedBy: ownerUser,
      });

      const companyUsers = await userRepository.findByCompanyId(company.id);
      const deactivatedUser = companyUsers.find((u) => u.id === broker.id);

      expect(deactivatedUser).toBeDefined();
      expect(deactivatedUser?.isActive).toBe(false);
    });
  });
});
