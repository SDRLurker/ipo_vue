import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  // 이 부분이 추가되거나 수정된 부분입니다.
  // 'ipo_vue'는 GitHub 저장소 이름과 동일해야 합니다.
  base: '/ipo_vue/',

  optimizeDeps: {
    include: ['vue-cal']
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
