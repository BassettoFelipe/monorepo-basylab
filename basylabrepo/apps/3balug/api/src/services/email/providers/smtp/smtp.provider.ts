import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { Constants } from "@/config/constants";
import { logger } from "@/config/logger";
import type { IEmailService } from "../../contracts/email-service.interface";
import { EmailServiceError } from "../../contracts/email-service.interface";
import { passwordResetTemplate } from "../../templates/password-reset.template";
import { userInvitationTemplate } from "../../templates/user-invitation.template";
import { verificationCodeTemplate } from "../../templates/verification-code.template";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  totpStepSeconds: number;
}

/**
 * SMTP Email Service Provider
 *
 * Implements the generic email service interface using SMTP/Nodemailer
 */
export class SmtpProvider implements IEmailService {
  private transporter: Transporter;
  private readonly config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      pool: true,
      maxConnections: Constants.SMTP.MAX_CONNECTIONS,
      maxMessages: Constants.SMTP.MAX_MESSAGES,
      rateDelta: Constants.SMTP.RATE_DELTA_MS,
      rateLimit: Constants.SMTP.RATE_LIMIT,
      connectionTimeout: Constants.SMTP.CONNECTION_TIMEOUT_MS,
      greetingTimeout: Constants.SMTP.GREETING_TIMEOUT_MS,
      socketTimeout: Constants.SMTP.SOCKET_TIMEOUT_MS,
    });
  }

  private withTimeout<T>(promise: Promise<T>, operation: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`${operation} timeout after ${Constants.TIMEOUTS.EMAIL_SEND_MS}ms`)),
          Constants.TIMEOUTS.EMAIL_SEND_MS,
        ),
      ),
    ]);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified successfully");
      return true;
    } catch (error) {
      logger.error(
        {
          err: error,
          smtp: {
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            user: this.config.user,
          },
        },
        "Failed to verify SMTP connection",
      );
      return false;
    }
  }

  async sendVerificationCode(to: string, name: string, code: string): Promise<void> {
    const expirationMinutes = Math.floor(this.config.totpStepSeconds / 60);

    const html = verificationCodeTemplate({
      name,
      code,
      expirationMinutes,
    });

    try {
      const info = await this.withTimeout(
        this.transporter.sendMail({
          from: this.config.from,
          to,
          subject: `Código de verificação: ${code} - CRM Imobil`,
          html,
        }),
        "Send verification code email",
      );

      logger.info(
        {
          messageId: info.messageId,
          recipient: to,
          accepted: info.accepted,
          rejected: info.rejected,
        },
        "Verification code email sent successfully",
      );
    } catch (error) {
      logger.error(
        {
          err: error,
          recipient: to,
          smtp: {
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
          },
        },
        "Failed to send verification code email",
      );

      throw new EmailServiceError(
        "Falha ao enviar email de verificação. Por favor, tente novamente.",
        error as Error,
      );
    }
  }

  async sendPasswordResetCode(to: string, name: string, code: string): Promise<void> {
    const expirationMinutes = Math.floor(this.config.totpStepSeconds / 60);

    logger.info(
      {
        recipient: to,
        name,
        code,
        expirationMinutes,
        smtp: {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          user: this.config.user,
          from: this.config.from,
        },
      },
      "Attempting to send password reset email",
    );

    const html = passwordResetTemplate({
      name,
      code,
      expirationMinutes,
    });

    try {
      const info = await this.withTimeout(
        this.transporter.sendMail({
          from: this.config.from,
          to,
          subject: `Redefinição de senha: ${code} - CRM Imobil`,
          html,
        }),
        "Send password reset email",
      );

      logger.info(
        {
          messageId: info.messageId,
          recipient: to,
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
        },
        "Password reset code email sent successfully",
      );
    } catch (error) {
      logger.error(
        {
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorType: error?.constructor?.name,
          recipient: to,
          smtp: {
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
          },
        },
        "Failed to send password reset code email",
      );

      throw new EmailServiceError(
        "Falha ao enviar email de redefinição de senha. Por favor, tente novamente.",
        error as Error,
      );
    }
  }

  async sendUserInvitation(
    to: string,
    name: string,
    companyName: string,
    role: string,
    invitedBy: string,
    resetPasswordUrl: string,
  ): Promise<void> {
    const html = userInvitationTemplate({
      name,
      email: to,
      companyName,
      role,
      invitedBy,
      resetPasswordUrl,
    });

    try {
      const info = await this.withTimeout(
        this.transporter.sendMail({
          from: this.config.from,
          to,
          subject: `Convite para ${companyName} - 3Balug`,
          html,
        }),
        "Send user invitation email",
      );

      logger.info(
        {
          messageId: info.messageId,
          recipient: to,
          accepted: info.accepted,
          rejected: info.rejected,
          role,
          companyName,
        },
        "User invitation email sent successfully",
      );
    } catch (error) {
      logger.error(
        {
          err: error,
          recipient: to,
          role,
          companyName,
          smtp: {
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
          },
        },
        "Failed to send user invitation email",
      );

      throw new EmailServiceError(
        "Falha ao enviar email de convite. Por favor, tente novamente.",
        error as Error,
      );
    }
  }
}
