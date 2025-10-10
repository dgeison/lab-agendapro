import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    strictPort: true, // Falha se a porta estiver em uso em vez de tentar outra
    open: false // Não abre automaticamente o navegador
  }
})