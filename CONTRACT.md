# SendLib NestJS integration contract

## Responsibility boundary

`@sendlib/nest-sdk` is a NestJS adapter around `@sendlib/node-sdk`. The Node SDK remains the source of truth for HTTP transport, API inputs and responses, validation, retries, cancellation, and errors.

The adapter must not catch and replace Node SDK errors or maintain competing DTOs.

## Public providers

- `SendlibModule` configures the integration.
- `SendlibService` exposes `emails`, `templates`, `batches`, and `deliverability` from one injected client.
- `SENDLIB_CLIENT` identifies the raw `Sendlib` client provider.
- `SENDLIB_MODULE_OPTIONS` identifies resolved module options.

## Synchronous registration

`SendlibModule.forRoot(options)` accepts all `SendlibOptions` plus an optional `isGlobal` flag. Registration creates exactly one `Sendlib` instance for that module registration.

## Asynchronous registration

`SendlibModule.forRootAsync(options)` supports `useFactory`, `useClass`, and `useExisting`, along with `imports` and `inject`. An asynchronous options source may return either options or a promise of options.

Exactly one of `useFactory`, `useClass`, or `useExisting` must be configured.

## Service behavior

`SendlibService` delegates directly to the injected client. Its resource properties retain the Node SDK method signatures and return values. Thrown errors retain their original identity.

The Nest entry point re-exports the raw `Sendlib` class, public Node SDK input/response/configuration
types, namespace interfaces, and complete public error hierarchy. It does not define parallel DTOs
or error subclasses.

The callable surface is `emails.send`; generic and convenience methods under `templates`;
`deliverability.analyze`; and `batches.create`, `batches.retrieve`, and `batches.wait`. The complete
list and representative inputs are maintained in `SENDLIB_NEST_SDK_EXAMPLES.md` and protected by a
compiler-checked fixture in `examples/complete.ts`.

## Package compatibility

- `@sendlib/node-sdk` is a regular runtime dependency with an intentional compatible range.
- `@nestjs/common`, `@nestjs/core`, `reflect-metadata`, and `rxjs` are peer dependencies.
- `@nestjs/config` is optional and used only in examples and tests.
- The Node runtime floor cannot be lower than the Node SDK's runtime floor.

The verified initial matrix uses NestJS 12.0.1 and 12.0.3, `reflect-metadata` 0.1.12 and 0.2.2,
RxJS 7.1.0 and 7.8.2, and `@sendlib/node-sdk` 0.1.2. NestJS 12.0.0 is outside the supported range
because its core package declares an incompatible NestJS 11 common-package peer.

## Security boundary

Module options must never be logged. Tests and examples must use placeholder credentials and sanitized payloads.
