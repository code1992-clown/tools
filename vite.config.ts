import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [vue(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      canvg: resolve(__dirname, 'src/shims/empty.ts'),
      html2canvas: resolve(__dirname, 'src/shims/empty.ts'),
      dompurify: resolve(__dirname, 'src/shims/empty.ts'),
    },
  },
})