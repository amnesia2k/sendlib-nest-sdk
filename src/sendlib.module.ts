import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import { Sendlib, type SendlibOptions } from '@sendlib/node-sdk';

import { SENDLIB_CLIENT, SENDLIB_MODULE_OPTIONS } from './sendlib.constants.js';
import type {
  SendlibModuleAsyncOptions,
  SendlibModuleOptions,
  SendlibOptionsFactory,
} from './sendlib.interfaces.js';
import { SendlibService } from './sendlib.service.js';

function clientOptions(options: SendlibModuleOptions): SendlibOptions {
  const resolvedOptions = { ...options };
  Reflect.deleteProperty(resolvedOptions, 'isGlobal');
  return resolvedOptions;
}

function createClient(options: SendlibModuleOptions): Sendlib {
  return new Sendlib(clientOptions(options));
}

function assertOneAsyncStrategy(options: SendlibModuleAsyncOptions): void {
  const strategyCount = [options.useFactory, options.useClass, options.useExisting].filter(
    (strategy) => strategy !== undefined,
  ).length;

  if (strategyCount !== 1) {
    throw new TypeError(
      'SendlibModule.forRootAsync() requires exactly one of useFactory, useClass, or useExisting',
    );
  }
}

function asyncOptionsProvider(options: SendlibModuleAsyncOptions): Provider {
  if (options.useFactory !== undefined) {
    return {
      provide: SENDLIB_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
  }

  const optionsFactory = options.useExisting ?? options.useClass;

  if (optionsFactory === undefined) {
    throw new TypeError('An asynchronous SendLib options factory is required');
  }

  return {
    provide: SENDLIB_MODULE_OPTIONS,
    useFactory: (factory: SendlibOptionsFactory) => factory.createSendlibOptions(),
    inject: [optionsFactory],
  };
}

function asyncOptionsProviders(options: SendlibModuleAsyncOptions): Provider[] {
  const provider = asyncOptionsProvider(options);

  if (options.useClass === undefined) {
    return [provider];
  }

  return [{ provide: options.useClass, useClass: options.useClass }, provider];
}

const clientProvider: Provider = {
  provide: SENDLIB_CLIENT,
  useFactory: createClient,
  inject: [SENDLIB_MODULE_OPTIONS],
};

/** Configures and exports the SendLib providers for a NestJS application. */
@Module({})
export class SendlibModule {
  /** Register SendLib using immediately available options. */
  static forRoot(options: SendlibModuleOptions): DynamicModule {
    return {
      module: SendlibModule,
      global: options.isGlobal ?? false,
      providers: [
        { provide: SENDLIB_MODULE_OPTIONS, useValue: clientOptions(options) },
        clientProvider,
        SendlibService,
      ],
      exports: [SENDLIB_CLIENT, SendlibService],
    };
  }

  /** Register SendLib using options resolved by Nest's dependency-injection container. */
  static forRootAsync(options: SendlibModuleAsyncOptions): DynamicModule {
    assertOneAsyncStrategy(options);

    return {
      module: SendlibModule,
      global: options.isGlobal ?? false,
      imports: options.imports ?? [],
      providers: [...asyncOptionsProviders(options), clientProvider, SendlibService],
      exports: [SENDLIB_CLIENT, SendlibService],
    };
  }
}
