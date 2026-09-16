import {
  SENDLIB_CLIENT,
  SENDLIB_MODULE_OPTIONS,
  SendlibModule,
  SendlibService,
} from '../../src/index.js';
import type { SendlibOptionsFactory } from '../../src/index.js';
import { describe, expect, it } from 'vitest';

class TestOptionsFactory implements SendlibOptionsFactory {
  createSendlibOptions() {
    return { apiKey: 'test-key' };
  }
}

describe('SendlibModule metadata', () => {
  it('uses distinct public injection tokens', () => {
    expect(typeof SENDLIB_CLIENT).toBe('symbol');
    expect(typeof SENDLIB_MODULE_OPTIONS).toBe('symbol');
    expect(SENDLIB_CLIENT).not.toBe(SENDLIB_MODULE_OPTIONS);
  });

  it('configures the requested global scope', () => {
    expect(SendlibModule.forRoot({ apiKey: 'test-key' }).global).toBe(false);
    expect(SendlibModule.forRoot({ apiKey: 'test-key', isGlobal: true }).global).toBe(true);
  });

  it('exports the client token and injectable service', () => {
    expect(SendlibModule.forRoot({ apiKey: 'test-key' }).exports).toEqual([
      SENDLIB_CLIENT,
      SendlibService,
    ]);
  });

  it('requires exactly one asynchronous configuration strategy', () => {
    expect(() => SendlibModule.forRootAsync({})).toThrow(
      'requires exactly one of useFactory, useClass, or useExisting',
    );

    expect(() =>
      SendlibModule.forRootAsync({
        useFactory: () => ({ apiKey: 'test-key' }),
        useClass: TestOptionsFactory,
      }),
    ).toThrow('requires exactly one of useFactory, useClass, or useExisting');
  });
});
