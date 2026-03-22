import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: 'dist/index.js',
  target: ['esnext'],
}).catch(() => process.exit(1));

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: 'dist/index-fallback.js',
  target: ['esnext'],
  alias: {
    // This catches the library itself and redirects it to your stub
    '@violent-orangutan/ink-picture': path.resolve(__dirname, 'src/cli/ui/components/preview-stub.tsx')
  },
}).catch(() => process.exit(1));