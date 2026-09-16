# SendLib NestJS SDK: complete TypeScript examples

This guide covers every callable operation exposed by `@sendlib/nest-sdk` version `0.1.0`. The
Nest service delegates to `@sendlib/node-sdk` version `0.1.x`, so inputs, responses, errors,
cancellation, retries, and limits retain the Node SDK contract.

Use the SDK only in trusted server-side code. Never expose a SendLib API key in a browser bundle,
controller response, log message, or committed environment file.

## Install and configure

The SDK requires Node.js 22 or newer and NestJS 12.0.1 or newer.

```bash
bun add @sendlib/nest-sdk
```

The host Nest application supplies `@nestjs/common`, `@nestjs/core`, `reflect-metadata`, and
`rxjs`. The package installs `@sendlib/node-sdk` as its only regular runtime dependency.

Set the API key in the server environment:

```dotenv
SENDLIB_API_KEY=sl_your_api_key_here
```

The SDK never loads `.env` or reads `process.env` itself. Your application owns configuration
loading and validation.

## Static module registration

Use `forRoot()` when configuration is already available during module definition:

```ts
import { Module } from '@nestjs/common';
import { SendlibModule } from '@sendlib/nest-sdk';

const apiKey = process.env.SENDLIB_API_KEY;
if (!apiKey) throw new Error('SENDLIB_API_KEY is required');

@Module({
  imports: [
    SendlibModule.forRoot({
      apiKey,
      isGlobal: false,
    }),
  ],
})
export class AppModule {}
```

`isGlobal` defaults to `false`. Import the module where it is needed unless the application has a
clear reason to make it global.

### All client options

```ts
import type { SendlibFetch } from '@sendlib/nest-sdk';

const tracedFetch: SendlibFetch = async (input, init) => {
  const startedAt = performance.now();

  try {
    return await fetch(input, init);
  } finally {
    // Never log init.headers, recipients, or message bodies.
    console.info('SendLib HTTP duration (ms):', performance.now() - startedAt);
  }
};

SendlibModule.forRoot({
  apiKey: process.env.SENDLIB_API_KEY!,
  baseUrl: 'https://sendlib.samueltuoyo.com',
  authMode: 'bearer',
  timeoutMs: 30_000,
  maxRetries: 2,
  fetch: tracedFetch,
  isGlobal: false,
});
```

## Asynchronous module registration

Configure exactly one of `useFactory`, `useClass`, or `useExisting`.

### `useFactory`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SendlibModule } from '@sendlib/nest-sdk';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SendlibModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        apiKey: config.getOrThrow<string>('SENDLIB_API_KEY'),
        timeoutMs: 30_000,
      }),
    }),
  ],
})
export class AppModule {}
```

The factory may return options directly or return a promise.

### `useClass`

```ts
import { Injectable, Module } from '@nestjs/common';
import {
  SendlibModule,
  type SendlibModuleOptions,
  type SendlibOptionsFactory,
} from '@sendlib/nest-sdk';

@Injectable()
class ApplicationSendlibOptions implements SendlibOptionsFactory {
  createSendlibOptions(): SendlibModuleOptions {
    return { apiKey: process.env.SENDLIB_API_KEY! };
  }
}

@Module({
  imports: [SendlibModule.forRootAsync({ useClass: ApplicationSendlibOptions })],
})
export class AppModule {}
```

`useClass` creates a private options-factory instance for this module registration.

### `useExisting`

```ts
@Module({
  providers: [ApplicationSendlibOptions],
  exports: [ApplicationSendlibOptions],
})
class ConfigurationModule {}

@Module({
  imports: [
    SendlibModule.forRootAsync({
      imports: [ConfigurationModule],
      useExisting: ApplicationSendlibOptions,
    }),
  ],
})
export class AppModule {}
```

`useExisting` reuses an options provider exported by an imported module.

## Inject the service

The operation examples below assume an injectable application service with this constructor:

```ts
import { Injectable } from '@nestjs/common';
import { SendlibService } from '@sendlib/nest-sdk';

@Injectable()
export class NotificationsService {
  constructor(private readonly sendlib: SendlibService) {}
}
```

The four service properties are the exact `emails`, `templates`, `deliverability`, and `batches`
objects from the configured Node SDK client.

## 1. `this.sendlib.emails.send()`

`emails.send()` supports custom content or one existing dashboard template. Do not mix the two
input modes.

### Send custom HTML and plain text

```ts
const response = await this.sendlib.emails.send({
  from: '"Example Support" <support@example.com>',
  to: ['ada@example.com', 'grace@example.com'],
  cc: 'account-owner@example.com',
  bcc: ['audit@example.com', 'records@example.com'],
  replyTo: 'helpdesk@example.com',
  subject: 'Your account update',
  html: '<p>Your requested account update is ready.</p>',
  text: 'Your requested account update is ready.',
});

console.log('Debug issue count:', response.debug?.issues?.length ?? 0);
```

Custom sends require `subject` and `html`; `text` is an optional fallback. Recipient fields accept
one address or an array where supported by the Node SDK input type.

### Send an attachment

```ts
import { readFile } from 'node:fs/promises';

const pdf = await readFile('./invoice.pdf');

await this.sendlib.emails.send({
  to: 'customer@example.com',
  subject: 'Your invoice',
  html: '<p>Your invoice is attached.</p>',
  text: 'Your invoice is attached.',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: pdf.toString('base64'),
      type: 'application/pdf',
    },
  ],
});
```

Pass raw base64 in `content`, without a `data:` URL prefix. Batch sends do not support attachments.

### Send a dashboard template through the lower-level method

```ts
await this.sendlib.emails.send({
  from: '"Example App" <app@example.com>',
  to: 'ada@example.com',
  template: 'password-reset',
  data: {
    name: 'Ada',
    code: '482921',
  },
});
```

### Per-call timeout and cancellation

```ts
import { SendlibAbortError, SendlibTimeoutError } from '@sendlib/nest-sdk';

const controller = new AbortController();

try {
  const request = this.sendlib.emails.send(
    {
      to: 'ada@example.com',
      subject: 'Your account update',
      html: '<p>Your account update is ready.</p>',
    },
    {
      signal: controller.signal,
      timeoutMs: 10_000,
    },
  );

  // Call controller.abort() when the surrounding request or job is cancelled.
  await request;
} catch (error: unknown) {
  if (error instanceof SendlibAbortError) {
    console.error('The caller cancelled the send.');
  } else if (error instanceof SendlibTimeoutError) {
    console.error('The HTTP attempt timed out.');
  } else {
    throw error;
  }
}
```

The SDK never automatically retries an email-creating POST.

## 2. Template operations

Templates must already exist in the SendLib dashboard. The generic method supports any current or
future slug; the convenience methods select documented starter slugs.

### `this.sendlib.templates.send()`

```ts
await this.sendlib.templates.send(
  'my-dashboard-template',
  {
    from: '"Example App" <app@example.com>',
    to: 'ada@example.com',
    data: {
      name: 'Ada',
      preferences: { locale: 'en-NG' },
    },
  },
  { timeoutMs: 10_000 },
);
```

### `this.sendlib.templates.welcome()`

```ts
await this.sendlib.templates.welcome({
  to: 'ada@example.com',
  data: { name: 'Ada', product: 'Example Cloud' },
});
```

### `this.sendlib.templates.verifyEmail()`

```ts
await this.sendlib.templates.verifyEmail({
  to: 'ada@example.com',
  data: {
    name: 'Ada',
    link: 'https://example.com/verify?token=server-generated-token',
  },
});
```

### `this.sendlib.templates.passwordReset()`

```ts
await this.sendlib.templates.passwordReset({
  to: 'ada@example.com',
  data: { name: 'Ada', code: '482921' },
});
```

### `this.sendlib.templates.otp()`

```ts
await this.sendlib.templates.otp({
  to: 'ada@example.com',
  data: { name: 'Ada', code: '731904' },
});
```

### `this.sendlib.templates.invoice()`

```ts
await this.sendlib.templates.invoice({
  to: 'ada@example.com',
  data: {
    name: 'Ada',
    amount: 'NGN 12,500.00',
    invoice_id: 'INV-2026-0042',
    date: '2026-09-15',
  },
});
```

### `this.sendlib.templates.paymentSuccessful()`

```ts
await this.sendlib.templates.paymentSuccessful({
  to: 'ada@example.com',
  data: {
    name: 'Ada',
    amount: 'NGN 12,500.00',
    product: 'Example Cloud Pro',
  },
});
```

### `this.sendlib.templates.paymentFailed()`

```ts
await this.sendlib.templates.paymentFailed({
  to: 'ada@example.com',
  data: {
    name: 'Ada',
    amount: 'NGN 12,500.00',
    retry_url: 'https://example.com/billing/retry',
  },
});
```

### `this.sendlib.templates.subscriptionExpiring()`

```ts
await this.sendlib.templates.subscriptionExpiring({
  to: 'ada@example.com',
  data: {
    name: 'Ada',
    plan: 'Pro',
    date: '2026-09-30',
  },
});
```

### `this.sendlib.templates.accountSuspended()`

```ts
await this.sendlib.templates.accountSuspended({
  to: 'ada@example.com',
  data: {
    name: 'Ada',
    reason: 'Billing verification is required',
    support_url: 'https://example.com/support',
  },
});
```

All template methods accept optional `from` and `{ signal, timeoutMs }`. Dashboard templates are
editable, so the `data` keys above are examples rather than enforced field names.

## 3. Deliverability analysis

`deliverability.analyze()` is synchronous and local. It does not make an HTTP request, mutate the
input, block sending, or guarantee inbox placement.

```ts
import type { SendEmailInput } from '@sendlib/nest-sdk';

const email: SendEmailInput = {
  from: '"Example Support" <support@example.com>',
  to: 'ada@example.com',
  subject: 'A quick update about your account',
  html: '<p>Your requested account update is ready.</p>',
  text: 'Your requested account update is ready.',
};

const report = this.sendlib.deliverability.analyze(email);

for (const issue of report.issues) {
  console.warn(issue.code, issue.field, issue.message);
}

if (report.passedAutomatedChecks) {
  await this.sendlib.emails.send(email);
}
```

## 4. Pro batch operations

Batch sending requires a SendLib Pro plan. Queue the batch once, then retrieve or poll by ID.

### `this.sendlib.batches.create()`

```ts
const created = await this.sendlib.batches.create(
  {
    from: '"Example Operations" <operations@example.com>',
    subject: 'Service update for {{name}}',
    recipients: [
      { email: 'ada@example.com', variables: { name: 'Ada' } },
      { email: 'grace@example.com', variables: { name: 'Grace' } },
    ],
    html: '<p>Hello {{name}}, your service update is ready.</p>',
    text: 'Hello {{name}}, your service update is ready.',
    replyTo: 'support@example.com',
  },
  { timeoutMs: 30_000 },
);

console.log(created.batchId, created.total, created.status);
```

At least one of `html` or `text` is required. The creation POST is never automatically retried.

### `this.sendlib.batches.retrieve()`

```ts
const status = await this.sendlib.batches.retrieve(created.batchId, {
  timeoutMs: 10_000,
});

console.log(status.status, status.progress, status.sent, status.failed, status.total);
```

This safe GET can be retried according to the configured `maxRetries` setting.

### `this.sendlib.batches.wait()`

```ts
const finalStatus = await this.sendlib.batches.wait(created.batchId, {
  intervalMs: 1_000,
  timeoutMs: 60_000,
  returnOnPausedLimit: true,
});

if (finalStatus.status === 'paused_limit_reached') {
  console.info('Gmail quota paused the batch; persist its ID and check again later.');
} else {
  console.info('Batch completed:', finalStatus.sent, finalStatus.failed);
}
```

For `wait()`, `timeoutMs` is the entire polling deadline. A failed status throws
`SendlibBatchFailedError`.

### Cancel batch polling

```ts
import { SendlibAbortError } from '@sendlib/nest-sdk';

const pollingController = new AbortController();

try {
  const polling = this.sendlib.batches.wait(created.batchId, {
    intervalMs: 1_000,
    timeoutMs: 60_000,
    signal: pollingController.signal,
  });

  // Call pollingController.abort() during application shutdown or job cancellation.
  await polling;
} catch (error: unknown) {
  if (error instanceof SendlibAbortError) {
    console.info('Local polling stopped; the remote batch was not cancelled.');
  } else {
    throw error;
  }
}
```

## 5. Handle every public SDK error

The Nest adapter does not catch, wrap, log, or translate Node SDK errors. Check subclasses before
their parent classes:

```ts
import {
  SendlibAbortError,
  SendlibApiError,
  SendlibAuthenticationError,
  SendlibBatchFailedError,
  SendlibBatchWaitTimeoutError,
  SendlibConfigError,
  SendlibError,
  SendlibForbiddenError,
  SendlibNetworkError,
  SendlibPayloadTooLargeError,
  SendlibPlanRequiredError,
  SendlibRateLimitError,
  SendlibTimeoutError,
  SendlibValidationError,
} from '@sendlib/nest-sdk';

export function describeSendlibError(error: unknown): string {
  if (error instanceof SendlibPlanRequiredError) {
    return `The ${error.feature} feature requires the ${error.requiredPlan} plan.`;
  }
  if (error instanceof SendlibAuthenticationError) return 'Check the server-side API key.';
  if (error instanceof SendlibPayloadTooLargeError) return 'Reduce the payload size.';
  if (error instanceof SendlibRateLimitError) {
    return `Rate limited; retry after ${error.retryAfterMs ?? 'an unknown number of'} ms.`;
  }
  if (error instanceof SendlibForbiddenError) return 'The account cannot perform this operation.';
  if (error instanceof SendlibBatchFailedError) return `Batch ${error.batchId} failed.`;
  if (error instanceof SendlibBatchWaitTimeoutError) {
    return `Batch ${error.batchId} exceeded ${error.timeoutMs} ms.`;
  }
  if (error instanceof SendlibConfigError) return `Invalid configuration: ${error.message}`;
  if (error instanceof SendlibValidationError) return `Invalid input: ${error.message}`;
  if (error instanceof SendlibTimeoutError) return 'One HTTP attempt timed out.';
  if (error instanceof SendlibAbortError) return 'The caller cancelled the operation.';
  if (error instanceof SendlibNetworkError) return 'No HTTP response was received.';
  if (error instanceof SendlibApiError) return `SendLib returned HTTP ${error.status}.`;
  if (error instanceof SendlibError) return error.message;
  return 'An unexpected non-SendLib error occurred.';
}
```

Response bodies, recipient data, and batch failure details may be sensitive. Redact them before
logging.

## Inject the raw Node client

Most applications should inject `SendlibService`. Advanced integrations can inject the exact Node
SDK client instance:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { SENDLIB_CLIENT, type Sendlib } from '@sendlib/nest-sdk';

@Injectable()
export class AdvancedSendlibService {
  constructor(@Inject(SENDLIB_CLIENT) private readonly client: Sendlib) {}
}
```

## Override the client in a test

Override `SENDLIB_CLIENT` to prevent network access and control results:

```ts
import { Test } from '@nestjs/testing';
import { SENDLIB_CLIENT, SendlibModule, SendlibService, type Sendlib } from '@sendlib/nest-sdk';
import { expect, vi } from 'vitest';

const send = vi.fn<Sendlib['emails']['send']>();
const fakeClient = { emails: { send } } satisfies Pick<Sendlib, 'emails'>;

const moduleRef = await Test.createTestingModule({
  imports: [SendlibModule.forRoot({ apiKey: 'test-only-key' })],
})
  .overrideProvider(SENDLIB_CLIENT)
  .useValue(fakeClient)
  .compile();

const service = moduleRef.get(SendlibService);
await service.emails.send({
  to: 'recipient@example.test',
  subject: 'Test',
  html: '<p>Test</p>',
});

expect(send).toHaveBeenCalledOnce();
```

## Complete callable API checklist

| Public call                                               | Purpose                                                  |
| --------------------------------------------------------- | -------------------------------------------------------- |
| `SendlibModule.forRoot(options)`                          | Register immediately available options.                  |
| `SendlibModule.forRootAsync(options)`                     | Register options from one async DI strategy.             |
| `service.emails.send(input, options?)`                    | Send custom content or a dashboard template immediately. |
| `service.templates.send(slug, input, options?)`           | Send any dashboard template slug.                        |
| `service.templates.welcome(input, options?)`              | Send the `welcome` starter template.                     |
| `service.templates.verifyEmail(input, options?)`          | Send the `verify-email` starter template.                |
| `service.templates.passwordReset(input, options?)`        | Send the `password-reset` starter template.              |
| `service.templates.otp(input, options?)`                  | Send the `otp` starter template.                         |
| `service.templates.invoice(input, options?)`              | Send the `invoice` starter template.                     |
| `service.templates.paymentSuccessful(input, options?)`    | Send the `payment-successful` starter template.          |
| `service.templates.paymentFailed(input, options?)`        | Send the `payment-failed` starter template.              |
| `service.templates.subscriptionExpiring(input, options?)` | Send the `subscription-expiring` starter template.       |
| `service.templates.accountSuspended(input, options?)`     | Send the `account-suspended` starter template.           |
| `service.deliverability.analyze(input)`                   | Analyze content locally without an HTTP request.         |
| `service.batches.create(input, options?)`                 | Queue a Pro batch.                                       |
| `service.batches.retrieve(batchId, options?)`             | Retrieve one batch status snapshot.                      |
| `service.batches.wait(batchId, options?)`                 | Poll a batch with a bounded deadline.                    |

That table includes every callable entry point exposed through the Nest integration. The remaining
public exports are injection tokens, option interfaces, the raw client class, Node SDK types, and
error classes intended for `instanceof` checks.

The repository also keeps a compiler-checked version of this surface in
[`examples/complete.ts`](./examples/complete.ts). Run `bun run typecheck:examples` and
`bun run check:examples` after changing the public API or this guide.
