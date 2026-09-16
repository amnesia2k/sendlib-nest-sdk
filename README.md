# SendLib NestJS SDK

[![npm version](https://img.shields.io/npm/v/@sendlib/nest-sdk.svg)](https://www.npmjs.com/package/@sendlib/nest-sdk)
[![CI](https://github.com/amnesia2k/sendlib-nest-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/amnesia2k/sendlib-nest-sdk/actions/workflows/ci.yml)

> [!IMPORTANT]
> `@sendlib/nest-sdk` is an independent, community-maintained NestJS integration. It is not an
> official SendLib or NestJS product. Report integration problems to this project's
> [issue tracker](https://github.com/amnesia2k/sendlib-nest-sdk/issues). SendLib account, Gmail,
> billing, quota, and service questions belong with
> [SendLib's official documentation and support](https://sendlib.samueltuoyo.com/docs).

A typed, server-side NestJS adapter for [`@sendlib/node-sdk`](https://www.npmjs.com/package/@sendlib/node-sdk).
It provides dependency-injection-friendly configuration while preserving the Node SDK's email,
template, batch, deliverability, cancellation, retry, response, and error contracts.

## Status

`@sendlib/nest-sdk` is published on npm under the `latest` tag. The project is currently in the
`0.x` release line, so review the changelog before upgrading a minor version.

- npm: [npmjs.com/package/@sendlib/nest-sdk](https://www.npmjs.com/package/@sendlib/nest-sdk)
- Source: [github.com/amnesia2k/sendlib-nest-sdk](https://github.com/amnesia2k/sendlib-nest-sdk)
- Issues: [GitHub Issues](https://github.com/amnesia2k/sendlib-nest-sdk/issues)
- Complete API examples: [SENDLIB_NEST_SDK_EXAMPLES.md](./SENDLIB_NEST_SDK_EXAMPLES.md)
- Public contract: [CONTRACT.md](./CONTRACT.md)

## New here? Start with these sections

1. [Install the package](#installation).
2. [Create an API key](#sendlib-account-setup).
3. [Register the module](#quick-start-recommended).
4. [Inject `SendlibService`](#implement-an-application-email-service).
5. [Send a custom email](#custom-email).

After that, read only the feature you need: [attachments](#attachments),
[dashboard templates](#dashboard-templates), [Pro batch sending](#pro-batch-sending), or
[testing](#testing-without-network-calls).

## Features

- `SendlibModule.forRoot()` for static configuration.
- `SendlibModule.forRootAsync()` with `useFactory`, `useClass`, or `useExisting`.
- Injectable `SendlibService` with `emails`, `templates`, `batches`, and `deliverability`.
- Custom HTML email, plain-text fallbacks, CC, BCC, Reply-To, and attachments.
- Generic dashboard templates and all nine starter-template shortcuts.
- Pro batch creation, status retrieval, and bounded polling.
- Per-call timeouts, `AbortSignal` cancellation, and conservative safe-GET retries.
- Local deliverability analysis without an HTTP request.
- Raw Node SDK client injection for advanced integrations.
- Canonical Node SDK types and errors re-exported from one package.
- ESM and CommonJS builds with dedicated declarations.
- One regular runtime dependency: the zero-dependency `@sendlib/node-sdk`.

## Requirements and compatibility

| Dependency          | Supported range             |
| ------------------- | --------------------------- |
| Node.js             | `>=22`                      |
| `@nestjs/common`    | `^12.0.1`                   |
| `@nestjs/core`      | `^12.0.1`                   |
| `reflect-metadata`  | `^0.1.12 \|\| ^0.2.0`       |
| `rxjs`              | `^7.1.0`                    |
| `@sendlib/node-sdk` | `^0.1.2`, installed for you |
| ESM and CommonJS    | Supported                   |
| Browser/client use  | Not supported               |

The API key must remain in trusted server-side code. Never import this package into browser,
mobile, desktop-renderer, or public client bundles.

NestJS 12.0.0 is intentionally excluded because `@nestjs/core@12.0.0` declares an incompatible
NestJS 11 common-package peer. The tested NestJS floor is 12.0.1.

## Installation

Inside an existing NestJS application:

```sh
bun add @sendlib/nest-sdk
```

Or with npm:

```sh
npm install @sendlib/nest-sdk
```

The host application normally already provides the NestJS, `reflect-metadata`, and RxJS peers. Add
`@nestjs/config` only if you want to use the configuration examples below:

```sh
bun add @nestjs/config
```

## SendLib account setup

Before sending email:

1. Create or sign in to your SendLib account.
2. Follow SendLib's [Gmail connection guide](https://sendlib.samueltuoyo.com/docs/gmail).
3. Create an API key using SendLib's [API-key guide](https://sendlib.samueltuoyo.com/docs/keys).
4. Store it in a server-side secret manager or environment variable.

For local development, keep this in an ignored `.env` file:

```dotenv
SENDLIB_API_KEY=sl_your_api_key_here
```

The SDK does not load `.env` or read `process.env` by itself. The Nest application owns
configuration loading and validation.

## Quick start (recommended)

This setup uses `@nestjs/config`, resolves the key through Nest dependency injection, and makes the
SendLib providers available application-wide.

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SendlibModule } from '@sendlib/nest-sdk';

import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SendlibModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        apiKey: config.getOrThrow<string>('SENDLIB_API_KEY'),
        timeoutMs: 30_000,
        maxRetries: 2,
      }),
    }),
    NotificationsModule,
  ],
})
export class AppModule {}
```

`isGlobal` defaults to `false`. If you prefer explicit module boundaries, omit it and import the
configured `SendlibModule` into the feature module that owns email behavior.

## Implement an application email service

Keep SendLib calls behind an application-owned provider. Controllers and jobs can then depend on
your business methods rather than transport details.

```ts
// notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { SendlibService } from '@sendlib/nest-sdk';

@Injectable()
export class NotificationsService {
  constructor(private readonly sendlib: SendlibService) {}

  sendAccountUpdate(to: string) {
    return this.sendlib.emails.send({
      from: '"Example Support" <support@example.com>',
      to,
      subject: 'Your account update',
      html: '<p>Your requested account update is ready.</p>',
      text: 'Your requested account update is ready.',
    });
  }

  sendWelcome(to: string, name: string) {
    return this.sendlib.templates.welcome({
      to,
      data: { name, product: 'Example Cloud' },
    });
  }
}
```

Register and export the application service:

```ts
// notifications/notifications.module.ts
import { Module } from '@nestjs/common';

import { NotificationsService } from './notifications.service.js';

@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

Use it from a controller, resolver, queue consumer, scheduled job, or another provider:

```ts
import { Body, Controller, Post } from '@nestjs/common';

import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('account-update')
  async sendAccountUpdate(@Body('email') email: string) {
    await this.notifications.sendAccountUpdate(email);
    return { accepted: true };
  }
}
```

Validate the authenticated user's permission and the recipient before sending. Do not expose raw
SendLib errors or responses directly from a public controller.

## Registration options

### Static registration

Use `forRoot()` when configuration is available while the module is defined:

```ts
import { Module } from '@nestjs/common';
import { SendlibModule } from '@sendlib/nest-sdk';

const apiKey = process.env.SENDLIB_API_KEY;
if (!apiKey) throw new Error('SENDLIB_API_KEY is required');

@Module({
  imports: [SendlibModule.forRoot({ apiKey })],
})
export class NotificationsModule {}
```

### Async registration with `useFactory`

```ts
SendlibModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => ({
    apiKey: config.getOrThrow<string>('SENDLIB_API_KEY'),
    authMode: 'bearer',
    timeoutMs: 30_000,
    maxRetries: 2,
  }),
});
```

The factory may return options directly or return a promise.

### Async registration with `useClass`

```ts
import { Injectable } from '@nestjs/common';
import {
  SendlibModule,
  type SendlibModuleOptions,
  type SendlibOptionsFactory,
} from '@sendlib/nest-sdk';

@Injectable()
class ApplicationSendlibOptions implements SendlibOptionsFactory {
  createSendlibOptions(): SendlibModuleOptions {
    const apiKey = process.env.SENDLIB_API_KEY;
    if (!apiKey) throw new Error('SENDLIB_API_KEY is required');
    return { apiKey };
  }
}

SendlibModule.forRootAsync({ useClass: ApplicationSendlibOptions });
```

`useClass` creates a private options-factory instance for that registration.

### Async registration with `useExisting`

```ts
@Module({
  providers: [ApplicationSendlibOptions],
  exports: [ApplicationSendlibOptions],
})
class ConfigurationModule {}

SendlibModule.forRootAsync({
  imports: [ConfigurationModule],
  useExisting: ApplicationSendlibOptions,
});
```

`useExisting` reuses an exported provider. Configure exactly one of `useFactory`, `useClass`, or
`useExisting`.

### Client options

| Option       | Type                      | Default                               |
| ------------ | ------------------------- | ------------------------------------- |
| `apiKey`     | `string`                  | Required                              |
| `baseUrl`    | `string`                  | SendLib API origin                    |
| `authMode`   | `'bearer' \| 'x-api-key'` | `'bearer'`                            |
| `timeoutMs`  | `number`                  | `30000` per HTTP attempt              |
| `maxRetries` | `number`                  | `2` for operations safe to retry      |
| `fetch`      | `typeof globalThis.fetch` | Node's global `fetch`                 |
| `isGlobal`   | `boolean`                 | `false`; Nest integration option only |

Configuration is validated during provider creation. Invalid configuration fails application
bootstrap without making a network request.

## Sending email

The following examples assume a class with:

```ts
constructor(private readonly sendlib: SendlibService) {}
```

### Custom email

```ts
const response = await this.sendlib.emails.send({
  from: '"Alex at Example" <alex@example.com>',
  to: ['ada@example.com', 'grace@example.com'],
  subject: 'Quick update regarding your account',
  html: '<p>Your requested account update is ready.</p>',
  text: 'Your requested account update is ready.',
});

console.log('Debug issue count:', response.debug?.issues?.length ?? 0);
```

Custom sends require `subject` and `html`; `text` is an optional plain-text fallback. The SDK does
not rewrite content, recipients, or display names.

### CC, BCC, and Reply-To

```ts
await this.sendlib.emails.send({
  from: '"Example Support" <support@example.com>',
  to: 'customer@example.com',
  cc: ['account-owner@example.com'],
  bcc: ['audit@example.com', 'records@example.com'],
  replyTo: 'helpdesk@example.com',
  subject: 'Your support update',
  html: '<p>We updated your support request.</p>',
  text: 'We updated your support request.',
});
```

Use BCC for a few hidden copies of identical content. Use a Pro batch when each recipient needs
personalized values, background progress, or individual results.

## Attachments

SendLib expects raw base64 content without a `data:` URL prefix:

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

Batch sends do not support attachments. Base64 increases binary size, so account for the encoded
request as well as the source file.

## Dashboard templates

Templates must already exist in the SendLib dashboard. The SDK selects templates; it does not
create, edit, fetch, or render them.

### Send any template slug

```ts
await this.sendlib.templates.send('my-dashboard-template', {
  from: '"Example App" <app@example.com>',
  to: 'ada@example.com',
  data: {
    name: 'Ada',
    preferences: { locale: 'en-NG' },
  },
});
```

### Use a starter-template shortcut

```ts
await this.sendlib.templates.passwordReset({
  to: 'ada@example.com',
  data: { name: 'Ada', code: '482921' },
});
```

All available shortcuts:

| Method                 | Dashboard slug          | Example data keys                      |
| ---------------------- | ----------------------- | -------------------------------------- |
| `welcome()`            | `welcome`               | `name`, `product`                      |
| `verifyEmail()`        | `verify-email`          | `name`, `link`                         |
| `passwordReset()`      | `password-reset`        | `name`, `code`                         |
| `otp()`                | `otp`                   | `name`, `code`                         |
| `invoice()`            | `invoice`               | `name`, `amount`, `invoice_id`, `date` |
| `paymentSuccessful()`  | `payment-successful`    | `name`, `amount`, `product`            |
| `paymentFailed()`      | `payment-failed`        | `name`, `amount`, `retry_url`          |
| `subscriptionExpiring` | `subscription-expiring` | `name`, `plan`, `date`                 |
| `accountSuspended()`   | `account-suspended`     | `name`, `reason`, `support_url`        |

Dashboard templates are editable. These data keys are examples, not fixed validation requirements.

The lower-level email mode is also available:

```ts
await this.sendlib.emails.send({
  to: 'ada@example.com',
  template: 'password-reset',
  data: { name: 'Ada', code: '482921' },
});
```

Do not mix template mode with custom `subject`, `html`, attachments, CC, or BCC.

## Pro batch sending

> [!WARNING]
> Batch sending requires a SendLib Pro plan and does not support attachments.

Use one application method to create the job and wait for a bounded result:

```ts
async sendServiceUpdate() {
  const created = await this.sendlib.batches.create({
    from: '"Example Operations" <operations@example.com>',
    subject: 'Service update for {{name}}',
    recipients: [
      { email: 'ada@example.com', variables: { name: 'Ada' } },
      { email: 'grace@example.com', variables: { name: 'Grace' } },
    ],
    html: '<p>Hello {{name}}, your service update is ready.</p>',
    text: 'Hello {{name}}, your service update is ready.',
    replyTo: 'support@example.com',
  });

  return this.sendlib.batches.wait(created.batchId, {
    intervalMs: 1_000,
    timeoutMs: 60_000,
    returnOnPausedLimit: true,
  });
}
```

The creation POST is never automatically retried, preventing ambiguous failures from creating
duplicate jobs.

### Retrieve one status snapshot

```ts
const status = await this.sendlib.batches.retrieve(batchId, {
  timeoutMs: 10_000,
});

console.log(status.status, status.progress, status.sent, status.failed);
```

### Handle polling outcomes

```ts
const finalStatus = await this.sendlib.batches.wait(batchId, {
  intervalMs: 1_000,
  timeoutMs: 60_000,
  returnOnPausedLimit: true,
});

if (finalStatus.status === 'paused_limit_reached') {
  // Persist the batch ID and check again later.
  console.info('Gmail quota paused the batch.');
} else {
  console.info('Batch completed:', finalStatus.sent, finalStatus.failed);
}
```

`wait()` throws `SendlibBatchFailedError` for a failed terminal state and
`SendlibBatchWaitTimeoutError` when its overall polling deadline expires. Aborting only stops local
polling; it does not cancel the remote SendLib batch.

## Error handling

The Nest adapter preserves the original Node SDK error objects and `instanceof` identity. It does
not convert them into Nest HTTP exceptions because the provider can also run in queues, workers,
scheduled jobs, command-line applications, and non-HTTP transports.

```ts
import {
  SendlibApiError,
  SendlibAuthenticationError,
  SendlibPlanRequiredError,
  SendlibRateLimitError,
  SendlibValidationError,
} from '@sendlib/nest-sdk';

async sendSafely(to: string) {
  try {
    return await this.sendlib.emails.send({
      to,
      subject: 'Account update',
      html: '<p>Your account update is ready.</p>',
    });
  } catch (error: unknown) {
    if (error instanceof SendlibValidationError) {
      throw new Error(`Invalid email request: ${error.message}`);
    }
    if (error instanceof SendlibAuthenticationError) {
      throw new Error('The server-side SendLib credential is invalid.');
    }
    if (error instanceof SendlibPlanRequiredError) {
      throw new Error(`The ${error.feature} feature requires the ${error.requiredPlan} plan.`);
    }
    if (error instanceof SendlibRateLimitError) {
      throw new Error(`Rate limited for ${String(error.retryAfterMs ?? 'unknown')} ms.`);
    }
    if (error instanceof SendlibApiError) {
      throw new Error(`SendLib returned HTTP ${String(error.status)}.`);
    }
    throw error;
  }
}
```

Public error classes include:

| Error                          | Meaning                                             |
| ------------------------------ | --------------------------------------------------- |
| `SendlibConfigError`           | Invalid client configuration.                       |
| `SendlibValidationError`       | Locally detectable invalid request or call options. |
| `SendlibAuthenticationError`   | HTTP `401`; missing or invalid API key.             |
| `SendlibForbiddenError`        | General HTTP `403`.                                 |
| `SendlibPlanRequiredError`     | Batch HTTP `403`; Pro is required.                  |
| `SendlibPayloadTooLargeError`  | HTTP `413`.                                         |
| `SendlibRateLimitError`        | HTTP `429`, optionally with `retryAfterMs`.         |
| `SendlibApiError`              | Another non-success SendLib HTTP response.          |
| `SendlibNetworkError`          | No HTTP response was available.                     |
| `SendlibTimeoutError`          | One HTTP attempt exceeded its timeout.              |
| `SendlibAbortError`            | The caller cancelled the operation.                 |
| `SendlibBatchFailedError`      | A batch reached the terminal failed state.          |
| `SendlibBatchWaitTimeoutError` | The overall polling deadline expired.               |

Sanitize `error.body`, batch results, recipients, and request content before logging them.

## Timeouts and cancellation

Every HTTP endpoint accepts `{ timeoutMs, signal }`:

```ts
import { SendlibAbortError, SendlibTimeoutError } from '@sendlib/nest-sdk';

const controller = new AbortController();

try {
  const request = this.sendlib.emails.send(
    {
      to: 'ada@example.com',
      subject: 'Account update',
      html: '<p>Your account update is ready.</p>',
    },
    {
      timeoutMs: 10_000,
      signal: controller.signal,
    },
  );

  // Call this when the surrounding job or request is cancelled.
  // controller.abort();
  await request;
} catch (error: unknown) {
  if (error instanceof SendlibAbortError) {
    console.info('The caller cancelled the operation.');
  } else if (error instanceof SendlibTimeoutError) {
    console.info('The HTTP attempt timed out.');
  } else {
    throw error;
  }
}
```

Long-running providers can cancel polling during application shutdown:

```ts
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { SendlibService } from '@sendlib/nest-sdk';

@Injectable()
export class BatchMonitor implements OnModuleDestroy {
  private readonly shutdown = new AbortController();

  constructor(private readonly sendlib: SendlibService) {}

  wait(batchId: string) {
    return this.sendlib.batches.wait(batchId, {
      signal: this.shutdown.signal,
      timeoutMs: 60_000,
    });
  }

  onModuleDestroy() {
    this.shutdown.abort();
  }
}
```

## Retry behavior

The Nest adapter adds no retry behavior. The Node SDK deliberately applies retries only where the
operation is safe:

| Operation                | Automatically retried?                                  |
| ------------------------ | ------------------------------------------------------- |
| Immediate email creation | Never                                                   |
| Batch creation           | Never                                                   |
| Batch status retrieval   | Network failures, `429`, `500`, `502`, `503`, and `504` |

`maxRetries` counts retries after the first safe GET attempt. Cancellation and polling deadlines
also stop retry delays.

## Deliverability analysis

`deliverability.analyze()` is synchronous and local. It does not make a request, mutate input,
block sending, or guarantee inbox placement.

```ts
import type { SendEmailInput } from '@sendlib/nest-sdk';

const input: SendEmailInput = {
  from: '"Alex at Example" <alex@example.com>',
  to: 'ada@example.com',
  subject: 'Quick update regarding your account',
  html: '<p>Your requested account update is ready.</p>',
  text: 'Your requested account update is ready.',
};

const report = this.sendlib.deliverability.analyze(input);

for (const issue of report.issues) {
  console.warn(issue.code, issue.field, issue.message);
}

for (const check of report.manualChecks) {
  console.info(check.code, check.message);
}

if (report.passedAutomatedChecks) {
  await this.sendlib.emails.send(input);
}
```

## Testing without network calls

Override `SENDLIB_CLIENT` in Nest's testing module. This prevents real requests and keeps assertions
focused on application behavior.

```ts
import { Test } from '@nestjs/testing';
import { SENDLIB_CLIENT, SendlibModule, SendlibService, type Sendlib } from '@sendlib/nest-sdk';
import { expect, it, vi } from 'vitest';

it('sends an account update', async () => {
  const send = vi.fn<Sendlib['emails']['send']>().mockResolvedValue({});
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
    subject: 'Test account update',
    html: '<p>Test account update</p>',
  });

  expect(send).toHaveBeenCalledWith({
    to: 'recipient@example.test',
    subject: 'Test account update',
    html: '<p>Test account update</p>',
  });

  await moduleRef.close();
});
```

Use fake keys and `example.test` addresses in tests. The repository's normal test suite never
contacts SendLib.

## Injecting the raw Node client

Most applications should inject `SendlibService`. Advanced consumers can inject the exact
configured Node SDK client:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { SENDLIB_CLIENT, type Sendlib } from '@sendlib/nest-sdk';

@Injectable()
export class AdvancedSendlibService {
  constructor(@Inject(SENDLIB_CLIENT) private readonly client: Sendlib) {}

  get namespaces() {
    return {
      emails: this.client.emails,
      templates: this.client.templates,
      batches: this.client.batches,
      deliverability: this.client.deliverability,
    };
  }
}
```

`SendlibService` and `SENDLIB_CLIENT` reference the same underlying client instance for one module
registration.

## Complete callable API

| Namespace      | Calls                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module         | `SendlibModule.forRoot()`, `SendlibModule.forRootAsync()`                                                                                                                 |
| Emails         | `service.emails.send()`                                                                                                                                                   |
| Templates      | `send()`, `welcome()`, `verifyEmail()`, `passwordReset()`, `otp()`, `invoice()`, `paymentSuccessful()`, `paymentFailed()`, `subscriptionExpiring()`, `accountSuspended()` |
| Deliverability | `service.deliverability.analyze()`                                                                                                                                        |
| Batches        | `service.batches.create()`, `retrieve()`, `wait()`                                                                                                                        |

For a separate example of every call, every error class, raw injection, provider overrides, and
all async strategies, see [SENDLIB_NEST_SDK_EXAMPLES.md](./SENDLIB_NEST_SDK_EXAMPLES.md).

## Migrating from `@sendlib/node-sdk`

The Nest package wraps the Node client through composition, so operation calls stay the same:

1. Replace `new Sendlib({ apiKey })` with `SendlibModule.forRoot()` or `forRootAsync()`.
2. Inject `SendlibService` rather than passing a client between application services.
3. Keep calls through `emails`, `templates`, `deliverability`, and `batches` unchanged.
4. Import Node SDK types and error classes from `@sendlib/nest-sdk` if you prefer one entry point.

There is no DTO conversion, response conversion, or error remapping.

## Compatibility verification

Packed consumers are tested at both ends of the supported dependency matrix:

| Dependency          | Minimum tested | Latest tested |
| ------------------- | -------------- | ------------- |
| `@nestjs/common`    | 12.0.1         | 12.0.3        |
| `@nestjs/core`      | 12.0.1         | 12.0.3        |
| `@sendlib/node-sdk` | 0.1.2          | 0.1.2         |
| `reflect-metadata`  | 0.1.12         | 0.2.2         |
| `rxjs`              | 7.1.0          | 7.8.2         |

The compatibility suite installs the packed library into clean ESM and CommonJS NestJS consumers,
type-checks them, and boots application contexts without contacting SendLib.

## Security guidance

- Keep API keys server-side and rotate exposed credentials immediately.
- Never log module options, authorization headers, recipients, message bodies, or attachments.
- Do not return raw SendLib failures from controllers.
- Validate recipients and caller authorization before sending.
- Use separate credentials for development, staging, controlled live tests, and production.
- Treat upstream error bodies and per-recipient batch results as potentially sensitive.

Report vulnerabilities using [SECURITY.md](./SECURITY.md).

## Contributing

```sh
git clone https://github.com/amnesia2k/sendlib-nest-sdk.git
cd sendlib-nest-sdk
bun install --frozen-lockfile
bun run ci
bun run test:compatibility
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [RELEASING.md](./RELEASING.md) for the contribution and
release processes.

## Community status

This package is not affiliated with or endorsed by SendLib or NestJS. “SendLib” and “NestJS” are
used only to identify the services and frameworks with which this package interoperates.

## License

[MIT](./LICENSE)
