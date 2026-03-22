import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// マイグレーションファイルを out/main/migrations/ にコピーするプラグイン
const copyMigrationsPlugin = {
  name: 'copy-migrations',
  closeBundle() {
    const src = path.resolve('electron/db/migrations')
    const dest = path.resolve('out/main/migrations')
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach((f) => {
      fs.copyFileSync(path.join(src, f), path.join(dest, f))
    })
    console.log('✓ migrations copied to out/main/migrations/')
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMigrationsPlugin],
    resolve: {
      alias: {
        '@': resolve('src'),
        '@electron': resolve('electron'),
      },
    },
    build: {
      lib: {
        entry: { index: resolve('electron/main.ts') },
      },
      rollupOptions: {
        external: ['better-sqlite3', 'keytar'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: { index: resolve('electron/preload.ts') },
      },
      rollupOptions: {
        external: ['better-sqlite3', 'keytar'],
      },
    },
  },
  renderer: {
    root: resolve('src'),
    resolve: {
      alias: {
        '@': resolve('src'),
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve('src/index.html'),
      },
    },
  },
})