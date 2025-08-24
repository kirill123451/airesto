import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/airesto/',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]' 
      }
    }
  },
  plugins: [vue()]
})
