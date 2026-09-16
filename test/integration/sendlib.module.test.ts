import 'reflect-metadata';

import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Sendlib } from '@sendlib/node-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SENDLIB_CLIENT,
  SENDLIB_MODULE_OPTIONS,
  SendlibModule,
  type SendlibModuleOptions,
  type SendlibOptionsFactory,
  SendlibService,
} from '../../src/index.js';

const CONFIG_TOKEN = Symbol('CONFIG_TOKEN');

@Module({
  providers: [{ provide: CONFIG_TOKEN, useValue: 'factory-key' }],
  exports: [CONFIG_TOKEN],
})
class FactoryDependenciesModule {}

@Injectable()
class ClassOptionsFactory implements SendlibOptionsFactory {
  createSendlibOptions(): SendlibModuleOptions {
    return { apiKey: 'class-key' };
  }
}

@Injectable()
class ExistingOptionsFactory implements SendlibOptionsFactory {
  calls = 0;

  createSendlibOptions(): Promise<SendlibModuleOptions> {
    this.calls += 1;
    return Promise.resolve({ apiKey: 'existing-key' });
  }
}

@Module({
  providers: [ExistingOptionsFactory],
  exports: [ExistingOptionsFactory],
})
class ExistingFactoryModule {}

describe('SendlibModule registration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers one client and the service from static options without mutating them', async () => {
    const options: SendlibModuleOptions = { apiKey: 'static-key', isGlobal: true };
    const log = vi.spyOn(console, 'log');
    const warn = vi.spyOn(console, 'warn');
    const moduleRef = await Test.createTestingModule({
      imports: [SendlibModule.forRoot(options)],
    }).compile();

    try {
      const firstClient = moduleRef.get<Sendlib>(SENDLIB_CLIENT);
      const secondClient = moduleRef.get<Sendlib>(SENDLIB_CLIENT);
      const resolvedOptions = moduleRef.get<SendlibModuleOptions>(SENDLIB_MODULE_OPTIONS);

      expect(firstClient).toBeInstanceOf(Sendlib);
      expect(secondClient).toBe(firstClient);
      expect(moduleRef.get(SendlibService)).toBeInstanceOf(SendlibService);
      expect(resolvedOptions).toEqual({ apiKey: 'static-key' });
      expect(options).toEqual({ apiKey: 'static-key', isGlobal: true });
      expect(log).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await moduleRef.close();
    }
  });

  it('resolves useFactory dependencies through imported modules', async () => {
    const factory = vi.fn((apiKey: string) => ({ apiKey }));
    const moduleRef = await Test.createTestingModule({
      imports: [
        SendlibModule.forRootAsync({
          imports: [FactoryDependenciesModule],
          inject: [CONFIG_TOKEN],
          useFactory: factory,
        }),
      ],
    }).compile();

    try {
      expect(moduleRef.get<Sendlib>(SENDLIB_CLIENT)).toBeInstanceOf(Sendlib);
      expect(moduleRef.get(SendlibService)).toBeInstanceOf(SendlibService);
      expect(factory).toHaveBeenCalledOnce();
      expect(factory).toHaveBeenCalledWith('factory-key');
    } finally {
      await moduleRef.close();
    }
  });

  it('resolves options from a dedicated useClass provider', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SendlibModule.forRootAsync({ useClass: ClassOptionsFactory })],
    }).compile();

    try {
      expect(moduleRef.get<Sendlib>(SENDLIB_CLIENT)).toBeInstanceOf(Sendlib);
      expect(moduleRef.get<SendlibModuleOptions>(SENDLIB_MODULE_OPTIONS)).toEqual({
        apiKey: 'class-key',
      });
    } finally {
      await moduleRef.close();
    }
  });

  it('reuses an imported useExisting provider', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        SendlibModule.forRootAsync({
          imports: [ExistingFactoryModule],
          useExisting: ExistingOptionsFactory,
        }),
      ],
    }).compile();

    try {
      expect(moduleRef.get<Sendlib>(SENDLIB_CLIENT)).toBeInstanceOf(Sendlib);
      expect(moduleRef.get(ExistingOptionsFactory).calls).toBe(1);
    } finally {
      await moduleRef.close();
    }
  });

  it('supports overriding the raw client with a typed fake', async () => {
    const send = vi.fn<Sendlib['emails']['send']>();
    const originalClient = new Sendlib({ apiKey: 'test-key' });
    const fakeClient: Sendlib = {
      batches: originalClient.batches,
      deliverability: originalClient.deliverability,
      emails: { send },
      templates: originalClient.templates,
    };
    const response = { marker: 'provider-override' };
    send.mockResolvedValue(response);

    const moduleRef = await Test.createTestingModule({
      imports: [SendlibModule.forRoot({ apiKey: 'unused-test-key' })],
    })
      .overrideProvider(SENDLIB_CLIENT)
      .useValue(fakeClient)
      .compile();

    try {
      const service = moduleRef.get(SendlibService);
      const input = { to: 'recipient@example.test', subject: 'Test', html: '<p>Test</p>' };

      expect(service.emails).toBe(fakeClient.emails);
      await expect(service.emails.send(input)).resolves.toBe(response);
      expect(send).toHaveBeenCalledOnce();
    } finally {
      await moduleRef.close();
    }
  });
});
