import * as NodeSdk from '@sendlib/node-sdk';
import { describe, expect, it, vi } from 'vitest';

import * as NestSdk from '../../src/index.js';
import { SendlibService } from '../../src/index.js';
import type { SendEmailResponse, Sendlib } from '../../src/index.js';

function clientWithSend(send: Sendlib['emails']['send']): Sendlib {
  const client = new NestSdk.Sendlib({ apiKey: 'test-key' });
  return {
    batches: client.batches,
    deliverability: client.deliverability,
    emails: { send },
    templates: client.templates,
  };
}

describe('SendlibService', () => {
  it('exposes every namespace from the injected client by identity', () => {
    const client = new NestSdk.Sendlib({ apiKey: 'test-key' });
    const service = new SendlibService(client);

    expect(service.emails).toBe(client.emails);
    expect(service.templates).toBe(client.templates);
    expect(service.batches).toBe(client.batches);
    expect(service.deliverability).toBe(client.deliverability);
  });

  it('preserves resolved values and rejected errors by identity', async () => {
    const response: SendEmailResponse = { marker: 'same-response' };
    const error = new NestSdk.SendlibValidationError('same-error');
    const send = vi.fn<Sendlib['emails']['send']>();
    const service = new SendlibService(clientWithSend(send));
    const input = { to: 'recipient@example.test', subject: 'Test', html: '<p>Test</p>' };

    send.mockResolvedValueOnce(response);
    await expect(service.emails.send(input)).resolves.toBe(response);

    send.mockRejectedValueOnce(error);
    await expect(service.emails.send(input)).rejects.toBe(error);
  });
});

describe('Node SDK runtime re-exports', () => {
  const errorExports = [
    'SendlibAbortError',
    'SendlibApiError',
    'SendlibAuthenticationError',
    'SendlibBatchFailedError',
    'SendlibBatchWaitTimeoutError',
    'SendlibConfigError',
    'SendlibError',
    'SendlibForbiddenError',
    'SendlibNetworkError',
    'SendlibPayloadTooLargeError',
    'SendlibPlanRequiredError',
    'SendlibRateLimitError',
    'SendlibTimeoutError',
    'SendlibValidationError',
  ] as const;

  it('preserves the client and every error class by identity', () => {
    expect(NestSdk.Sendlib).toBe(NodeSdk.Sendlib);

    for (const exportName of errorExports) {
      expect(NestSdk[exportName]).toBe(NodeSdk[exportName]);
    }
  });
});
