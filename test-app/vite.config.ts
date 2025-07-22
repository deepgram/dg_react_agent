import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'deepgram-tts-react': resolve(__dirname, '../src/index.ts'),
      '@': resolve(__dirname, './src')
    }
  }
})
