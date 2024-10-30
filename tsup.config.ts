import { defineConfig } from 'tsup';
// biome-ignore lint/correctness/noNodejsModules: <explanation>
import { spawnSync } from 'node:child_process';

export default defineConfig({
  entry: ['src/**/index.ts', 'src/**/theme.ts'],
  format: 'esm',
  minify: false, // Disable minification during development
  splitting: false, // Disable code splitting during development
  sourcemap: true,
  treeshake: false, // Disable tree shaking during development
  outDir: 'esm',
  dts: false,
  //   Generate declaration files separately to improve performance in development
  async onSuccess() {
    spawnSync('tsc', ['--emitDeclarationOnly', '--declaration']);
    console.log('Declaration files generated');
  },
  inject: ['react-shim.js'],
});
