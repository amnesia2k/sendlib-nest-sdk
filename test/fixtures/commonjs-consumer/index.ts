import { Injectable, Module } from '@nestjs/common';
import nestSdk = require('@sendlib/nest-sdk');

const options: nestSdk.SendlibOptions = { apiKey: 'fixture-key' };

@Injectable()
export class ConsumerService {
  constructor(readonly sendlib: nestSdk.SendlibService) {}
}

@Module({
  imports: [nestSdk.SendlibModule.forRoot(options)],
  providers: [ConsumerService],
})
export class ConsumerModule {}

export const rawClientToken: symbol = nestSdk.SENDLIB_CLIENT;
export const clientConstructor: typeof nestSdk.Sendlib = nestSdk.Sendlib;
export type ConsumerError = nestSdk.SendlibError;
