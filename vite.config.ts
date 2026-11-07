import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // Le port est ici et pas seulement dans `.claude/launch.json` : c'est celui que
  // le README annonce, il doit donc valoir pour un `pnpm dev` nu.
  server: { port: 5190 },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        abutton: fileURLToPath(new URL('./abutton.html', import.meta.url))
      }
    }
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
})
