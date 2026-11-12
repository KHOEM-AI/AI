import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      // បញ្ជូន Request ទាំងអស់ដែលចាប់ផ្តើមដោយ /api ទៅកាន់ Backend Port 8787
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      // បញ្ជូន Request សម្រាប់ស្តាប់សំឡេង mp3 ទៅកាន់ Backend ដែរ
      '/audio': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
