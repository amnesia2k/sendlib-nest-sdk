import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  clean: true,
  // TypeScript owns declaration emit so ESM and CommonJS types remain explicit.
  dts: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  external: ['@nestjs/common', '@nestjs/core', '@sendlib/node-sdk', 'reflect-metadata', 'rxjs'],
});
