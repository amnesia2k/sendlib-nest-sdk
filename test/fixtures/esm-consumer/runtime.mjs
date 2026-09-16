import assert from 'node:assert/strict';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SendlibError as NodeSendlibError } from '@sendlib/node-sdk';
import {
  SENDLIB_CLIENT,
  Sendlib,
  SendlibError,
  SendlibModule,
  SendlibService,
} from '@sendlib/nest-sdk';
import 'reflect-metadata';

class ConsumerModule {}
Module({ imports: [SendlibModule.forRoot({ apiKey: 'fixture-key' })] })(ConsumerModule);

const application = await NestFactory.createApplicationContext(ConsumerModule, { logger: false });

try {
  const client = application.get(SENDLIB_CLIENT);
  const service = application.get(SendlibService);

  assert(client instanceof Sendlib);
  assert.equal(service.emails, client.emails);
  assert.equal(service.templates, client.templates);
  assert.equal(service.batches, client.batches);
  assert.equal(service.deliverability, client.deliverability);
  assert.equal(SendlibError, NodeSendlibError);
} finally {
  await application.close();
}
