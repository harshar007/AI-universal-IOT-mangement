import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Copy updated Nunnarri logo image and banner to public
try {
  const logoSrc = '/home/harshar/.gemini/antigravity-ide/brain/daf70038-5241-47f4-b776-0f2e0583c3fe/media__1785945326724.png'
  const bannerSrc = path.resolve(__dirname, '../nunnari banner .png')
  const logoDest = path.resolve(__dirname, 'public/logo.png')
  const bannerDest = path.resolve(__dirname, 'public/nunnari_banner.png')
  if (fs.existsSync(logoSrc)) fs.copyFileSync(logoSrc, logoDest)
  if (fs.existsSync(bannerSrc)) fs.copyFileSync(bannerSrc, bannerDest)
} catch (e) {
  console.error('Logo sync error:', e)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

