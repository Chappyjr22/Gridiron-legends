import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: resolve(__dirname, 'index.html'),
        spriteStudio: resolve(__dirname, 'sprite-studio.html'),
        playerLab: resolve(__dirname, 'player-lab.html'),
      },
    },
  },
});
