import { Inject, Injectable, Module } from '@nestjs/common';
import {
  SENDLIB_CLIENT,
  Sendlib,
  SendlibAbortError,
  SendlibApiError,
  SendlibAuthenticationError,
  SendlibBatchFailedError,
  SendlibBatchWaitTimeoutError,
  SendlibConfigError,
  SendlibError,
  SendlibForbiddenError,
  SendlibModule,
  SendlibNetworkError,
  SendlibPayloadTooLargeError,
  SendlibPlanRequiredError,
  SendlibRateLimitError,
  SendlibService,
  SendlibTimeoutError,
  SendlibValidationError,
  type SendEmailInput,
  type SendlibModuleOptions,
  type SendlibOptionsFactory,
} from '../src/index.js';

const exampleApiKey = 'server-side-example-key';

export const staticRegistration = SendlibModule.forRoot({
  apiKey: exampleApiKey,
  timeoutMs: 30_000,
  maxRetries: 2,
});

@Injectable()
export class ApplicationSendlibOptions implements SendlibOptionsFactory {
  createSendlibOptions(): SendlibModuleOptions {
    return { apiKey: exampleApiKey };
  }
}

@Module({
  providers: [ApplicationSendlibOptions],
  exports: [ApplicationSendlibOptions],
})
export class ConfigurationModule {}

export const factoryRegistration = SendlibModule.forRootAsync({
  inject: [ApplicationSendlibOptions],
  useFactory: (options: ApplicationSendlibOptions) => options.createSendlibOptions(),
});

export const classRegistration = SendlibModule.forRootAsync({
  useClass: ApplicationSendlibOptions,
});

export const existingRegistration = SendlibModule.forRootAsync({
  imports: [ConfigurationModule],
  useExisting: ApplicationSendlibOptions,
});

@Injectable()
export class CompleteNotificationsExample {
  constructor(private readonly sendlib: SendlibService) {}

  async sendEverySupportedOperation(): Promise<void> {
    const customEmail: SendEmailInput = {
      to: 'ada@example.com',
      subject: 'Account update',
      html: '<p>Your account update is ready.</p>',
      text: 'Your account update is ready.',
      attachments: [
        {
          filename: 'update.txt',
          content: Buffer.from('example').toString('base64'),
          type: 'text/plain',
        },
      ],
    };

    this.sendlib.deliverability.analyze(customEmail);
    await this.sendlib.emails.send(customEmail, { timeoutMs: 10_000 });
    await this.sendlib.emails.send({
      to: 'ada@example.com',
      template: 'custom-dashboard-template',
      data: { name: 'Ada' },
    });

    const templateInput = { to: 'ada@example.com', data: { name: 'Ada' } };
    await this.sendlib.templates.send('custom-dashboard-template', templateInput);
    await this.sendlib.templates.welcome(templateInput);
    await this.sendlib.templates.verifyEmail(templateInput);
    await this.sendlib.templates.passwordReset(templateInput);
    await this.sendlib.templates.otp(templateInput);
    await this.sendlib.templates.invoice(templateInput);
    await this.sendlib.templates.paymentSuccessful(templateInput);
    await this.sendlib.templates.paymentFailed(templateInput);
    await this.sendlib.templates.subscriptionExpiring(templateInput);
    await this.sendlib.templates.accountSuspended(templateInput);

    const created = await this.sendlib.batches.create({
      from: 'operations@example.com',
      subject: 'Hello {{name}}',
      recipients: [{ email: 'ada@example.com', variables: { name: 'Ada' } }],
      html: '<p>Hello {{name}}</p>',
    });
    await this.sendlib.batches.retrieve(created.batchId);

    const controller = new AbortController();
    await this.sendlib.batches.wait(created.batchId, {
      intervalMs: 1_000,
      timeoutMs: 60_000,
      signal: controller.signal,
      returnOnPausedLimit: true,
    });
  }
}

@Injectable()
export class RawClientExample {
  constructor(@Inject(SENDLIB_CLIENT) readonly client: Sendlib) {}
}

export function describeSendlibError(error: unknown): string {
  if (error instanceof SendlibPlanRequiredError) return `Requires ${error.requiredPlan}.`;
  if (error instanceof SendlibAuthenticationError) return 'Authentication failed.';
  if (error instanceof SendlibPayloadTooLargeError) return 'Payload too large.';
  if (error instanceof SendlibRateLimitError) return 'Rate limited.';
  if (error instanceof SendlibForbiddenError) return 'Forbidden.';
  if (error instanceof SendlibBatchFailedError) return `Batch ${error.batchId} failed.`;
  if (error instanceof SendlibBatchWaitTimeoutError) return `Batch ${error.batchId} timed out.`;
  if (error instanceof SendlibConfigError) return 'Invalid configuration.';
  if (error instanceof SendlibValidationError) return 'Invalid input.';
  if (error instanceof SendlibTimeoutError) return 'Request timed out.';
  if (error instanceof SendlibAbortError) return 'Request cancelled.';
  if (error instanceof SendlibNetworkError) return 'Network failure.';
  if (error instanceof SendlibApiError) return `HTTP ${String(error.status)}.`;
  if (error instanceof SendlibError) return error.message;
  return 'Unknown error.';
}
