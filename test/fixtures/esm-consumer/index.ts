import { Injectable, Module } from '@nestjs/common';
import {
  SENDLIB_CLIENT,
  Sendlib,
  type SendlibError,
  SendlibModule,
  type SendlibOptions,
  SendlibService,
} from '@sendlib/nest-sdk';

const options: SendlibOptions = { apiKey: 'fixture-key' };

@Injectable()
export class ConsumerService {
  constructor(readonly sendlib: SendlibService) {}
}

@Module({
  imports: [SendlibModule.forRoot(options)],
  providers: [ConsumerService],
})
export class ConsumerModule {}

export const rawClientToken: symbol = SENDLIB_CLIENT;
export const clientConstructor: typeof Sendlib = Sendlib;
export type ConsumerError = SendlibError;
