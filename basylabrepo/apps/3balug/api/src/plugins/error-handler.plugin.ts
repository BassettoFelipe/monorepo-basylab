import type { Elysia } from "elysia";
import { logger } from "@/config/logger";
import { AppError } from "@/errors/app.error";
import { HttpError } from "@/errors/http-error";

const translateValidationMessage = (message: string): string => {
  const patterns = [
    {
      regex: /Invalid input:\s*expected\s+(\w+),?\s*received\s+(\w+)/i,
      handler: (match: RegExpMatchArray): string => {
        const type = match[1]?.toLowerCase();
        const received = match[2]?.toLowerCase();

        if (received === "undefined" || received === "null") {
          return "Campo obrigatório";
        }

        const typeMap: Record<string, string> = {
          string: "texto",
          number: "número",
          boolean: "verdadeiro ou falso",
          object: "objeto",
          array: "lista",
        };

        return `Valor inválido. ${typeMap[type] || "Tipo de dado"} esperado`;
      },
    },
    {
      regex: /^Expected\s+(\w+)$/i,
      handler: (): string => "Campo obrigatório",
    },
    {
      regex: /Property\s+'([^']+)'\s+is\s+required/i,
      handler: (): string => {
        return "Campo obrigatório";
      },
    },
    {
      regex: /String length must be greater than or equal to (\d+)/i,
      handler: (match: RegExpMatchArray): string => {
        return `Deve ter pelo menos ${match[1]} caracteres`;
      },
    },
    {
      regex: /String length must be less than or equal to (\d+)/i,
      handler: (match: RegExpMatchArray): string => {
        return `Deve ter no máximo ${match[1]} caracteres`;
      },
    },
    {
      regex: /Expected string to match pattern/i,
      handler: (): string => "Formato inválido",
    },
    {
      regex: /Expected number to be greater than (\d+)/i,
      handler: (match: RegExpMatchArray): string => {
        return `Deve ser maior que ${match[1]}`;
      },
    },
    {
      regex: /Expected number to be less than (\d+)/i,
      handler: (match: RegExpMatchArray): string => {
        return `Deve ser menor que ${match[1]}`;
      },
    },
    {
      regex: /Invalid email|email.*invalid|Expected string to match 'email' format/i,
      handler: (): string => "Email inválido",
    },
    {
      regex: /Expected.*'email'.*format/i,
      handler: (): string => "Email inválido",
    },
    {
      regex: /Expected.*to match.*format/i,
      handler: (): string => "Formato inválido",
    },
    {
      regex: /not.*valid.*email/i,
      handler: (): string => "Email inválido",
    },
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern.regex);
    if (match) {
      return pattern.handler(match);
    }
  }

  const simpleTranslations: Record<string, string> = {
    "Invalid input": "Dados inválidos",
    Required: "Campo obrigatório",
    required: "Campo obrigatório",
    Invalid: "Inválido",
    invalid: "Inválido",
    Expected: "Esperado",
    expected: "esperado",
    received: "recebido",
    undefined: "não preenchido",
    null: "vazio",
    "must be": "deve ser",
    "should be": "deve ser",
    "greater than": "maior que",
    "less than": "menor que",
    "equal to": "igual a",
  };

  let translated = message;
  for (const [key, value] of Object.entries(simpleTranslations)) {
    translated = translated.replace(new RegExp(key, "gi"), value);
  }

  return translated;
};

export const errorHandlerPlugin = (app: Elysia) => {
  return app.onError({ as: "global" }, ({ error, set, code }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      logger.warn(
        {
          error: error.message,
          statusCode: 404,
          code,
        },
        "Route not found",
      );
      return {
        code: 404,
        message: "Rota não encontrada",
        type: "NOT_FOUND",
      };
    }

    if (code === "VALIDATION") {
      set.status = 422;

      const translatedMessage = translateValidationMessage(error.message);

      logger.warn(
        {
          error: error.message,
          translatedError: translatedMessage,
          statusCode: 422,
          code,
        },
        "Validation error",
      );

      return {
        code: 422,
        message: "Dados inválidos. Verifique os campos obrigatórios e tente novamente.",
        type: "VALIDATION_ERROR",
        details: translatedMessage,
      };
    }

    if (error instanceof AppError) {
      set.status = error.statusCode;
      const logData = {
        err: error,
        statusCode: error.statusCode,
        code: error.code,
        metadata: error.metadata,
      };
      const logMsg = `Application error: ${error.message}`;
      if (error.statusCode >= 500) {
        logger.error(logData, logMsg);
      } else {
        logger.warn(logData, logMsg);
      }
      return {
        code: error.statusCode,
        message: error.message,
        type: error.code || "APP_ERROR",
        ...(error.metadata || {}),
      };
    }

    if (error instanceof HttpError) {
      set.status = error.statusCode;
      const httpLogData = {
        err: error,
        statusCode: error.statusCode,
        type: error.type,
        metadata: error.metadata,
      };
      const httpLogMsg = `HTTP error: ${error.message}`;
      if (error.statusCode >= 500) {
        logger.error(httpLogData, httpLogMsg);
      } else {
        logger.warn(httpLogData, httpLogMsg);
      }
      return {
        code: error.statusCode,
        message: error.message,
        type: error.type,
        ...(error.metadata && { metadata: error.metadata }),
      };
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      const appError = error as AppError;
      set.status = appError.statusCode;
      const genericLogData = {
        err: appError,
        statusCode: appError.statusCode,
        code: appError.code,
      };
      const genericLogMsg = `Application error: ${appError.message}`;
      if (appError.statusCode >= 500) {
        logger.error(genericLogData, genericLogMsg);
      } else {
        logger.warn(genericLogData, genericLogMsg);
      }
      return {
        code: appError.statusCode,
        message: appError.message,
        type: appError.code || "APP_ERROR",
      };
    }

    set.status = 500;
    logger.error(
      {
        err: error,
        statusCode: 500,
      },
      "Internal server error",
    );
    return {
      code: 500,
      message: "Erro interno do servidor",
      type: "INTERNAL_SERVER_ERROR",
    };
  });
};
