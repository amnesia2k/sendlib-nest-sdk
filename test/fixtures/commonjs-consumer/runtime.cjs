'use strict';

const assert = require('node:assert/strict');

const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { SendlibError: NodeSendlibError } = require('@sendlib/node-sdk');
const {
  SENDLIB_CLIENT,
  Sendlib,
  SendlibError,
  SendlibModule,
  SendlibService,
} = require('@sendlib/nest-sdk');
require('reflect-metadata');

class ConsumerModule {}
Module({ imports: [SendlibModule.forRoot({ apiKey: 'fixture-key' })] })(ConsumerModule);

async function main() {
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
}

void main();
