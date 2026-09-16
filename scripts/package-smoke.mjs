import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const fixturesRoot = join(projectRoot, 'test', 'fixtures');
const temporaryRoot = join(projectRoot, '.tmp');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const useShell = process.platform === 'win32';
const requestedMatrix = process.argv.includes('--matrix')
  ? process.argv[process.argv.indexOf('--matrix') + 1]
  : 'latest';

const matrices = {
  minimum: {
    packages: [
      '@nestjs/common@12.0.1',
      '@nestjs/core@12.0.1',
      '@sendlib/node-sdk@0.1.2',
      '@types/node@^26.0.0',
      'reflect-metadata@0.1.12',
      'rxjs@7.1.0',
    ],
    versions: {
      '@nestjs/common': '12.0.1',
      '@nestjs/core': '12.0.1',
      '@sendlib/node-sdk': '0.1.2',
      'reflect-metadata': '0.1.12',
      rxjs: '7.1.0',
    },
  },
  latest: {
    packages: [
      '@nestjs/common@12.0.3',
      '@nestjs/core@12.0.3',
      '@sendlib/node-sdk@0.1.2',
      '@types/node@^26.0.0',
      'reflect-metadata@0.2.2',
      'rxjs@7.8.2',
    ],
    versions: {
      '@nestjs/common': '12.0.3',
      '@nestjs/core': '12.0.3',
      '@sendlib/node-sdk': '0.1.2',
      'reflect-metadata': '0.2.2',
      rxjs: '7.8.2',
    },
  },
};

if (!['all', ...Object.keys(matrices)].includes(requestedMatrix)) {
  throw new TypeError(`Unknown compatibility matrix: ${String(requestedMatrix)}`);
}

const selectedMatrices =
  requestedMatrix === 'all'
    ? Object.entries(matrices)
    : [[requestedMatrix, matrices[requestedMatrix]]];

function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: projectRoot,
    encoding: 'utf8',
    shell: useShell,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(
      [`Command failed: ${command} ${arguments_.join(' ')}`, result.stdout, result.stderr]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result.stdout.trim();
}

async function packageVersion(consumerRoot, packageName) {
  const manifestPath = join(
    consumerRoot,
    'node_modules',
    ...packageName.split('/'),
    'package.json',
  );
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(typeof manifest.version, 'string');
  return manifest.version;
}

await mkdir(temporaryRoot, { recursive: true });
const workspace = await mkdtemp(join(temporaryRoot, 'package-smoke-'));

try {
  run('bun', ['pm', 'pack', '--destination', workspace, '--quiet']);
  const archives = (await readdir(workspace)).filter((entry) => entry.endsWith('.tgz')).sort();
  assert.equal(archives.length, 1, 'Expected exactly one package tarball');
  const archive = join(workspace, archives[0]);
  await access(archive);

  for (const [matrixName, matrix] of selectedMatrices) {
    const consumerRoot = join(workspace, matrixName);
    const npmCache = join(workspace, 'npm-cache');
    await mkdir(consumerRoot, { recursive: true });
    await writeFile(
      join(consumerRoot, 'package.json'),
      `${JSON.stringify({ name: `sendlib-${matrixName}-matrix`, private: true }, null, 2)}\n`,
      'utf8',
    );
    await cp(join(fixturesRoot, 'esm-consumer'), join(consumerRoot, 'esm-consumer'), {
      recursive: true,
    });
    await cp(join(fixturesRoot, 'commonjs-consumer'), join(consumerRoot, 'commonjs-consumer'), {
      recursive: true,
    });

    run(
      npmCommand,
      [
        'install',
        archive,
        ...matrix.packages,
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--no-save',
        '--package-lock=false',
      ],
      {
        cwd: consumerRoot,
        env: { ...process.env, npm_config_cache: npmCache },
      },
    );

    const installedVersions = {};
    for (const [packageName, expectedVersion] of Object.entries(matrix.versions)) {
      const installedVersion = await packageVersion(consumerRoot, packageName);
      assert.equal(installedVersion, expectedVersion, `${matrixName}: unexpected ${packageName}`);
      installedVersions[packageName] = installedVersion;
    }

    const typescriptCli = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
    for (const fixture of ['esm-consumer', 'commonjs-consumer']) {
      const fixtureRoot = join(consumerRoot, fixture);
      run(process.execPath, [typescriptCli, '--project', join(fixtureRoot, 'tsconfig.json')], {
        cwd: fixtureRoot,
        shell: false,
      });
    }

    run(process.execPath, ['runtime.mjs'], {
      cwd: join(consumerRoot, 'esm-consumer'),
      shell: false,
    });
    run(process.execPath, ['runtime.cjs'], {
      cwd: join(consumerRoot, 'commonjs-consumer'),
      shell: false,
    });

    console.log(`Verified ${matrixName} matrix:`);
    for (const [packageName, version] of Object.entries(installedVersions)) {
      console.log(`- ${packageName}@${version}`);
    }
  }

  console.log('Verified packed ESM and CommonJS consumers without network calls to SendLib.');
} finally {
  await rm(workspace, { force: true, recursive: true });
}
