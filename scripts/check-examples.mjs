import { readFile } from 'node:fs/promises';

const guideUrl = new URL('../SENDLIB_NEST_SDK_EXAMPLES.md', import.meta.url);
const guide = await readFile(guideUrl, 'utf8');

const requiredExamples = [
  'SendlibModule.forRoot(',
  'SendlibModule.forRootAsync(',
  'useFactory',
  'useClass',
  'useExisting',
  'this.sendlib.emails.send(',
  'this.sendlib.templates.send(',
  'this.sendlib.templates.welcome(',
  'this.sendlib.templates.verifyEmail(',
  'this.sendlib.templates.passwordReset(',
  'this.sendlib.templates.otp(',
  'this.sendlib.templates.invoice(',
  'this.sendlib.templates.paymentSuccessful(',
  'this.sendlib.templates.paymentFailed(',
  'this.sendlib.templates.subscriptionExpiring(',
  'this.sendlib.templates.accountSuspended(',
  'this.sendlib.deliverability.analyze(',
  'this.sendlib.batches.create(',
  'this.sendlib.batches.retrieve(',
  'this.sendlib.batches.wait(',
  'SENDLIB_CLIENT',
  'overrideProvider(SENDLIB_CLIENT)',
  'SendlibError',
  'SendlibConfigError',
  'SendlibValidationError',
  'SendlibApiError',
  'SendlibAuthenticationError',
  'SendlibForbiddenError',
  'SendlibPlanRequiredError',
  'SendlibPayloadTooLargeError',
  'SendlibRateLimitError',
  'SendlibTimeoutError',
  'SendlibAbortError',
  'SendlibNetworkError',
  'SendlibBatchFailedError',
  'SendlibBatchWaitTimeoutError',
];

const missing = requiredExamples.filter((entry) => !guide.includes(entry));

if (missing.length > 0) {
  throw new Error(`The complete examples guide is missing:\n- ${missing.join('\n- ')}`);
}

if (/templates\.invoice\([\s\S]{0,300}\bvariables\s*:/.test(guide)) {
  throw new Error('Template examples must use data, not batch-only variables.');
}

console.log(`Complete examples guide covers ${requiredExamples.length} public API markers.`);
