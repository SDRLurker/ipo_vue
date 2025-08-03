import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Vue Router를 선택했으면 필요
import { createClient } from '@supabase/supabase-js'

// .env 파일에서 환경 변수를 가져옵니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const app = createApp(App)

// Vue 앱 전체에서 Supabase 클라이언트를 사용할 수 있도록 등록합니다.
app.provide('supabase', supabase)

app.use(router) // Vue Router를 선택했으면 필요

app.mount('#app')
