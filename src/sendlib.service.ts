import { Inject, Injectable } from '@nestjs/common';
import type { Sendlib } from '@sendlib/node-sdk';

import { SENDLIB_CLIENT } from './sendlib.constants.js';

/** Injectable NestJS facade for the configured SendLib client. */
@Injectable()
export class SendlibService {
  constructor(@Inject(SENDLIB_CLIENT) private readonly client: Sendlib) {}

  /** Immediate email operations from the underlying Node SDK client. */
  get emails(): Sendlib['emails'] {
    return this.client.emails;
  }

  /** Dashboard template operations from the underlying Node SDK client. */
  get templates(): Sendlib['templates'] {
    return this.client.templates;
  }

  /** Pro batch operations from the underlying Node SDK client. */
  get batches(): Sendlib['batches'] {
    return this.client.batches;
  }

  /** Local deliverability analysis from the underlying Node SDK client. */
  get deliverability(): Sendlib['deliverability'] {
    return this.client.deliverability;
  }
}
