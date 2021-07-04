import { defineConfig, mergeConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, basename } from 'path'
import glob from 'glob'
import minimist from 'minimist'

import removeEsmLegacy from './plugins/vite/remove-esm-legacy'
import { existsSync } from 'fs'

const baseConfig = defineConfig({
  base: './',
  publicDir: resolve(__dirname, 'public'),
  plugins: [
    vue(),
    removeEsmLegacy({
      removeEsmodules: true,
      polyfills: ['es.promise']
    })
  ],
  root: resolve(__dirname, 'src/pages'),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  }
})

function getBuildConfig (): UserConfig['build'] {
  const args = minimist(process.argv.slice(process.argv.indexOf('--') + 1))
  const pages: string[] = args.page
    ? typeof args.page === 'string'
      ? [args.page]
      : args.page
    : []
  
  const entries = {}
  if (pages.length) {
    pages.forEach((name) => {
      const id = resolve(__dirname, `src/pages/${name}.html`)
      if (existsSync(id)) {
        entries[name] = id
      } else {
        console.warn(`warning 不存在页面[${name}]的入口文件: ${id}`)
      }
    })
  }
  if (Object.keys(entries).length === 0) {
    const existPages = glob.sync(resolve(__dirname, 'src/pages/*.html'))
    existPages.forEach(id => {
      entries[basename(id).replace(/\.html$/, '')] = id
    })
  }

  return {
    rollupOptions: {
      input: entries,
      output: {
        manualChunks: {
          'vue-libs': ['vue']
        }
      }
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
}

function getServerConfig (): UserConfig['server'] {
  return {
    host: '0.0.0.0',
    port: 3030
  }
}

// https://vitejs.dev/config/
export default ({ command }) => {
  return command === 'build'
    ? mergeConfig(baseConfig, { build: getBuildConfig() })
    : mergeConfig(baseConfig, { server: getServerConfig() })
}
