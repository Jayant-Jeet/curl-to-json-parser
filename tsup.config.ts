import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: false,
    treeshake: true,
    minify: false
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['cjs', 'esm'],
    dts: false,
    clean: false,
    banner: { js: '#!/usr/bin/env node' },
    sourcemap: false,
    treeshake: true,
    minify: false
  }
]);
