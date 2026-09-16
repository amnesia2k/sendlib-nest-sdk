import type { FactoryProvider, ModuleMetadata, Type } from '@nestjs/common';
import type { SendlibOptions } from '@sendlib/node-sdk';

/** Configuration for synchronous SendLib module registration. */
export interface SendlibModuleOptions extends SendlibOptions {
  /** Make the registered providers globally available in the Nest application. */
  readonly isGlobal?: boolean;
}

/** Contract implemented by class-based asynchronous option providers. */
export interface SendlibOptionsFactory {
  createSendlibOptions(): Promise<SendlibModuleOptions> | SendlibModuleOptions;
}

/** Configuration for asynchronous SendLib module registration. */
export interface SendlibModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /** Make the registered providers globally available in the Nest application. */
  readonly isGlobal?: boolean;
  /** Dependencies injected into `useFactory`. */
  readonly inject?: FactoryProvider['inject'];
  /** Resolve options with an injectable factory function. */
  readonly useFactory?: FactoryProvider<SendlibModuleOptions>['useFactory'];
  /** Instantiate this class to resolve module options. */
  readonly useClass?: Type<SendlibOptionsFactory>;
  /** Reuse an existing injectable options factory. */
  readonly useExisting?: Type<SendlibOptionsFactory>;
}
