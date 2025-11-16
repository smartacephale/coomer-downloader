import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: 'dist/index.js',
  // minify: true,
  target: ['esnext']
}).catch(() => process.exit(1))

// "build": "esbuild src/index.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/index.js"

