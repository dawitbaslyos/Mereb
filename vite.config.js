import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      build: {
        outDir: 'dist-sdk',
        lib: {
          entry: 'src/sdk/index.js',
          name: 'Mereb',
          fileName: (format) => `mereb.${format}.js`,
          formats: ['es', 'umd']
        }
      },
      plugins: [
        {
          name: 'copy-dts',
          closeBundle() {
            if (!fs.existsSync('dist-sdk')) {
              fs.mkdirSync('dist-sdk', { recursive: true });
            }
            fs.copyFileSync(
              path.resolve('src/sdk/index.d.ts'),
              path.resolve('dist-sdk/index.d.ts')
            );
          }
        }
      ]
    };
  }

  return {
    build: {
      outDir: 'dist'
    }
  };
});
