import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        // FIX: Use path.join with __dirname for consistency with Electron project structure.
        // The 'Cannot find name __dirname' error is a TypeScript configuration issue
        // (e.g., missing @types/node or module setting), but __dirname is available
        // at runtime in this context.
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: {},
    }),
  ],
});