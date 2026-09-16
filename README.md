# SendLib NestJS SDK

Unofficial, community-maintained NestJS integration for
[`@sendlib/node-sdk`](https://www.npmjs.com/package/@sendlib/node-sdk).

> The implementation is complete through compatibility testing but has not yet been published to
> npm. Treat the current `0.1.0` source as prerelease software.

## Features

- `SendlibModule.forRoot()` for static configuration.
- `SendlibModule.forRootAsync()` with `useFactory`, `useClass`, or `useExisting`.
- Injectable singleton `SendlibService`.
- Direct `emails`, `templates`, `deliverability`, and `batches` namespaces.
- Raw Node client injection through `SENDLIB_CLIENT`.
- Canonical Node SDK types and errors re-exported without copies.
- ESM and CommonJS builds with dedicated declarations.
- No NestJS packages bundled or duplicated.
- One regular runtime dependency: the zero-dependency `@sendlib/node-sdk`.

## Requirements and tested compatibility

- Node.js 22 or newer.
- NestJS `^12.0.1`.
- `reflect-metadata` `^0.1.12 || ^0.2.0`.
- RxJS `^7.1.0`.
- `@sendlib/node-sdk` `^0.1.2`, installed automatically.

Packed consumers are tested at both ends of the current matrix:

| Dependency          | Minimum tested | Latest tested |
| ------------------- | -------------- | ------------- |
| `@nestjs/common`    | 12.0.1         | 12.0.3        |
| `@nestjs/core`      | 12.0.1         | 12.0.3        |
| `@sendlib/node-sdk` | 0.1.2          | 0.1.2         |
| `reflect-metadata`  | 0.1.12         | 0.2.2         |
| `rxjs`              | 7.1.0          | 7.8.2         |

NestJS 12.0.0 is intentionally excluded because `@nestjs/core@12.0.0` incorrectly declares
`@nestjs/common@^11.0.0`.

## Installation

After the first npm release:

```bash
bun add @sendlib/nest-sdk
```

The host application must already have compatible NestJS, `reflect-metadata`, and RxJS packages.
Do not separately install `@sendlib/node-sdk` unless the application imports it directly; the Nest
package installs the compatible client implementation it delegates to.

## SendLib account setup

Create a server-side SendLib API key and connect the sender account required by the SendLib service.
Keep the key in a secret manager or server environment variable:

```dotenv
SENDLIB_API_KEY=sl_your_api_key_here
```

The package never loads `.env`, reads environment variables, or logs module options. The consuming
application owns configuration loading and validation.

## Static configuration

```ts
import { Module } from '@nestjs/common';
import { SendlibModule } from '@sendlib/nest-sdk';

const apiKey = process.env.SENDLIB_API_KEY;
if (!apiKey) throw new Error('SENDLIB_API_KEY is required');

@Module({
  imports: [SendlibModule.forRoot({ apiKey })],
})
export class AppModule {}
```

Set `isGlobal: true` only when every feature module should see the providers without importing
`SendlibModule`. The default is `false`.

## Async configuration with `ConfigService`

`@nestjs/config` is optional; any injectable configuration source can be used.

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
      }),
    }),
  ],
})
export class AppModule {}
```

Exactly one async strategy is required. `useClass` creates a dedicated options factory;
`useExisting` reuses an exported provider. See the
[complete examples](./SENDLIB_NEST_SDK_EXAMPLES.md#asynchronous-module-registration).

## Inject and use the service

```ts
import { Injectable } from '@nestjs/common';
import { SendlibService } from '@sendlib/nest-sdk';

@Injectable()
export class NotificationsService {
  constructor(private readonly sendlib: SendlibService) {}

  sendWelcome(to: string, name: string) {
    return this.sendlib.templates.welcome({
      to,
      data: { name },
    });
  }
}
```

`SendlibService` returns the exact namespace objects owned by the Node client. It does not catch,
wrap, retry, log, or translate calls.

## Complete callable surface

| Namespace      | Calls                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module         | `SendlibModule.forRoot()`, `SendlibModule.forRootAsync()`                                                                                                                 |
| Emails         | `service.emails.send()`                                                                                                                                                   |
| Templates      | `send()`, `welcome()`, `verifyEmail()`, `passwordReset()`, `otp()`, `invoice()`, `paymentSuccessful()`, `paymentFailed()`, `subscriptionExpiring()`, `accountSuspended()` |
| Deliverability | `service.deliverability.analyze()`                                                                                                                                        |
| Batches        | `service.batches.create()`, `retrieve()`, `wait()`                                                                                                                        |

The [complete examples guide](./SENDLIB_NEST_SDK_EXAMPLES.md) includes inputs, attachments,
timeouts, cancellation, every template helper, deliverability checks, batch polling, and every
public error.

## Client options

`SendlibModuleOptions` extends the Node SDK's `SendlibOptions` with `isGlobal`:

| Option       | Type                      | Default                               |
| ------------ | ------------------------- | ------------------------------------- |
| `apiKey`     | `string`                  | Required                              |
| `baseUrl`    | `string`                  | SendLib API origin                    |
| `authMode`   | `'bearer' \| 'x-api-key'` | `'bearer'`                            |
| `timeoutMs`  | `number`                  | `30000` per HTTP attempt              |
| `maxRetries` | `number`                  | `2` for operations safe to retry      |
| `fetch`      | `typeof globalThis.fetch` | Node's global `fetch`                 |
| `isGlobal`   | `boolean`                 | `false`; Nest integration option only |

Configuration is validated when Nest creates the Node client. Invalid or missing configuration
fails application bootstrap without making a network request.

## Errors

All errors are the original Node SDK objects and preserve `instanceof` identity. The Nest package
re-exports:

- `SendlibConfigError` and `SendlibValidationError`.
- `SendlibAuthenticationError`, `SendlibForbiddenError`, and `SendlibPlanRequiredError`.
- `SendlibPayloadTooLargeError`, `SendlibRateLimitError`, and `SendlibApiError`.
- `SendlibNetworkError`, `SendlibTimeoutError`, and `SendlibAbortError`.
- `SendlibBatchFailedError` and `SendlibBatchWaitTimeoutError`.
- Base class `SendlibError`.

The adapter does not convert these into Nest HTTP exceptions because it also supports workers,
queues, CLI applications, and non-HTTP Nest contexts. Translate errors in the host application when
needed.

## Raw client injection

Advanced consumers can inject the configured Node client:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { SENDLIB_CLIENT, type Sendlib } from '@sendlib/nest-sdk';

@Injectable()
export class AdvancedService {
  constructor(@Inject(SENDLIB_CLIENT) private readonly client: Sendlib) {}
}
```

Prefer `SendlibService` unless direct access is specifically useful.

## Testing

Override `SENDLIB_CLIENT` with a typed fake to prevent network access:

```ts
const send = vi.fn<Sendlib['emails']['send']>();

const moduleRef = await Test.createTestingModule({
  imports: [SendlibModule.forRoot({ apiKey: 'test-only-key' })],
})
  .overrideProvider(SENDLIB_CLIENT)
  .useValue({ emails: { send } } satisfies Pick<Sendlib, 'emails'>)
  .compile();
```

The repository's tests and compatibility fixtures never contact SendLib.

## Migrating from `@sendlib/node-sdk`

Keep your existing Node SDK calls and move client construction into Nest's dependency-injection
container:

1. Replace `new Sendlib({ apiKey })` with `SendlibModule.forRoot()` or `forRootAsync()`.
2. Inject `SendlibService` instead of passing a client between application services.
3. Keep calls through `emails`, `templates`, `deliverability`, and `batches` unchanged.
4. Import existing Node SDK types and error classes from `@sendlib/nest-sdk` if you want one public
   entry point.

The Nest adapter uses composition and preserves the original client namespaces, return values, and
error identities. It does not require DTO conversion or exception remapping.

## Retry, timeout, and cancellation behavior

The Nest adapter adds no retry or lifecycle behavior. The Node SDK:

- Never automatically retries email-creating or batch-creating POST requests.
- May retry safe status GET requests according to `maxRetries`.
- Accepts `{ timeoutMs, signal }` on endpoint calls.
- Uses `intervalMs`, an overall `timeoutMs`, and an optional `signal` for `batches.wait()`.
- Stops only local polling when an abort signal fires; it does not cancel the remote batch.

## Compatibility verification

```bash
bun run ci
bun run test:compatibility
```

The compatibility command packs the library, installs it into isolated minimum/latest dependency
matrices, type-checks ESM and CommonJS consumers, and boots real Nest application contexts without
contacting SendLib.

The repository also runs `bun run typecheck:examples` and `bun run check:examples` so the
compiler-checked fixture and complete Markdown guide cannot silently lose public operations.

## Security guidance

- Keep API keys server-side and rotate exposed credentials immediately.
- Never log module options, authorization headers, recipients, message bodies, or attachments.
- Use separate credentials for development, staging, live tests, and production.
- Validate recipients and authorization in application code before sending.
- Treat upstream error bodies and batch recipient results as potentially sensitive.

Report vulnerabilities privately through [SECURITY.md](./SECURITY.md).

## Documentation

- [Complete NestJS examples](./SENDLIB_NEST_SDK_EXAMPLES.md)
- [Public integration contract](./CONTRACT.md)
- [Contributing](./CONTRIBUTING.md)
- [Support](./SUPPORT.md)
- [Release process](./RELEASING.md)
- [Changelog](./CHANGELOG.md)

## Community status

This package is an unofficial community integration. It is not affiliated with or endorsed by
SendLib or NestJS. SendLib account, billing, quota, template, or service incidents belong with
SendLib's official support channels.

## License

[MIT](./LICENSE)
