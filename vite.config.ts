import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist-vue', // rename for clarity
  },
  server: {
    port: 5123,
    strictPort: true,
  },
})
