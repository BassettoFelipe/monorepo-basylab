import {
  AccountDeactivatedError,
  AuthenticationRequiredError,
  SubscriptionRequiredError,
  UserNotFoundError,
} from "@basylab/core/errors";
import { Elysia } from "elysia";
import { logger } from "@/config/logger";
import { container } from "@/container";
import type { User } from "@/db/schema/users";
import type { CurrentSubscription } from "@/repositories/contracts/subscription.repository";
import type { AuthContext } from "./auth.middleware";

/**
 * Context derived from user validation middleware
 */
export interface ValidatedUserContext {
  validatedUser: User;
  validatedSubscription: CurrentSubscription;
  [key: string]: unknown;
}

/**
 * User and subscription data loaded from cache or database
 */
interface UserStateData {
  user: User;
  subscription: CurrentSubscription | null;
}

/**
 * Loads user state from cache or database
 * Also handles subscription lookup through owner if needed
 */
async function loadUserState(userId: string): Promise<UserStateData> {
  const cached = await container.userCacheService.get(userId);

  if (cached) {
    logger.debug({ userId }, "User state loaded from cache");
    return {
      user: cached.user as unknown as User,
      subscription: cached.subscription as unknown as CurrentSubscription | null,
    };
  }

  logger.debug({ userId }, "User state cache miss, loading from DB");

  const dbUser = await container.userRepository.findById(userId);

  if (!dbUser) {
    throw new UserNotFoundError(
      "Sua conta não foi encontrada. Por favor, entre em contato com o suporte.",
    );
  }

  // Try to get subscription from user or their owner
  const subscription = await findUserSubscription(userId, dbUser.createdBy);

  // Cache for future requests
  await container.userCacheService.set(userId, dbUser, subscription);

  return { user: dbUser, subscription };
}

/**
 * Finds subscription for a user, checking owner's subscription if needed
 */
async function findUserSubscription(
  userId: string,
  createdBy: string | null,
): Promise<CurrentSubscription | null> {
  const userSubscription = await container.subscriptionRepository.findCurrentByUserId(userId);

  if (userSubscription) {
    return userSubscription;
  }

  if (createdBy) {
    const owner = await container.userRepository.findById(createdBy);
    if (owner) {
      return container.subscriptionRepository.findCurrentByUserId(owner.id);
    }
  }

  return null;
}

/**
 * Validates that user account is active
 */
function validateUserActive(user: User): void {
  if (!user.isActive) {
    throw new AccountDeactivatedError();
  }
}

/**
 * Validates subscription exists and is in a valid state
 * @param allowPending - If true, allows pending subscriptions
 */
function validateSubscription(
  subscription: CurrentSubscription | null,
  allowPending: boolean,
): asserts subscription is CurrentSubscription {
  if (!subscription) {
    throw new SubscriptionRequiredError(
      "Você não possui uma assinatura ativa. Por favor, renove sua assinatura.",
    );
  }

  const { computedStatus } = subscription;

  if (computedStatus === "expired") {
    throw new SubscriptionRequiredError(
      "Sua assinatura expirou. Por favor, renove para continuar usando o sistema.",
    );
  }

  if (computedStatus === "canceled") {
    throw new SubscriptionRequiredError(
      allowPending
        ? "Sua assinatura não está mais ativa. Por favor, renove para continuar."
        : "Sua assinatura foi cancelada. Por favor, reative para continuar.",
    );
  }
}

/**
 * Core validation logic shared between middleware variants
 */
async function validateUserStateCore(
  userId: string,
  allowPending: boolean,
): Promise<ValidatedUserContext> {
  const { user, subscription } = await loadUserState(userId);

  validateUserActive(user);
  validateSubscription(subscription, allowPending);

  return {
    validatedUser: user,
    validatedSubscription: subscription,
  };
}

/**
 * Middleware to validate user state and subscription with Redis cache
 * Must be used AFTER requireAuth middleware
 *
 * Validates:
 * - User exists in database
 * - User is active (not deactivated)
 * - User has a valid subscription
 * - Subscription is not expired or canceled
 *
 * Uses Redis cache to avoid hitting the database on every request
 *
 * @example
 * app.use(requireAuth)
 *    .use(validateUserState)
 *    .get('/protected-route', handler)
 */
export const validateUserState = new Elysia({
  name: "validate-user-state",
}).derive({ as: "scoped" }, async (context): Promise<ValidatedUserContext> => {
  const { userId } = context as unknown as AuthContext;

  if (!userId) {
    throw new AuthenticationRequiredError();
  }

  return validateUserStateCore(userId, false);
});

/**
 * Middleware variant that allows pending subscriptions
 * Useful for checkout and payment routes
 *
 * @example
 * app.use(requireAuth)
 *    .use(validateUserStateAllowPending)
 *    .post('/payment/process', handler)
 */
export const validateUserStateAllowPending = new Elysia({
  name: "validate-user-state-allow-pending",
}).derive({ as: "global" }, async (context): Promise<ValidatedUserContext> => {
  const { userId } = context as unknown as AuthContext;

  if (!userId) {
    throw new AuthenticationRequiredError();
  }

  return validateUserStateCore(userId, true);
});
