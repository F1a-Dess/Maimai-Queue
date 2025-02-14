import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import io from 'socket.io-client'

// connect to backend
const socket = io('http://localhost:3000')
const app = createApp(App)


createApp(App).provide('socket', socket).mount('#app')
