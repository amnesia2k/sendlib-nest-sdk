import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const manifestUrl = new URL('../package.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const projectRoot = new URL('../', import.meta.url);
const expectedFiles = [
  manifest.main,
  manifest.module,
  manifest.types,
  manifest.exports?.['.']?.import?.types,
  manifest.exports?.['.']?.require?.types,
];

for (const relativePath of expectedFiles) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new TypeError('main, module, and types must be non-empty package paths');
  }

  await access(new URL(relativePath, projectRoot));
}

const esm = await import(manifest.name);
const require = createRequire(import.meta.url);
const commonjs = require(manifest.name);

for (const [format, module] of [
  ['ESM', esm],
  ['CommonJS', commonjs],
]) {
  if ('default' in module) {
    throw new TypeError(`${format} must not expose a default export`);
  }

  for (const exportName of [
    'Sendlib',
    'SendlibModule',
    'SendlibService',
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
  ]) {
    if (typeof module[exportName] !== 'function') {
      throw new TypeError(`${format} must export ${exportName} as a class`);
    }
  }

  for (const exportName of ['SENDLIB_CLIENT', 'SENDLIB_MODULE_OPTIONS']) {
    if (typeof module[exportName] !== 'symbol') {
      throw new TypeError(`${format} must export ${exportName} as a symbol`);
    }
  }
}

console.log(`Verified Phase 3 ESM, CommonJS, and types exports for ${manifest.name}.`);
