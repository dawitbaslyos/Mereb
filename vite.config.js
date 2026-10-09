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
      }
    };
  }

  return {
    build: {
      outDir: 'dist'
    }
  };
});
