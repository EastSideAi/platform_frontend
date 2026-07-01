import { defineConfig } from 'vite';

// EastSide — сборка платформы.
// Код написан на гиперскрипте (React.createElement через h()), без JSX-синтаксиса и
// без ES-импортов: модули общаются через window.E* и читают глобальный React. Поэтому
// бандлеру не нужен JSX-плагин — он просто собирает side-effect модули по порядку
// (см. src/main.js) в один минифицированный файл с хешем. Это убирает рантайм-Babel
// и водопад из 36 запросов, ради которых раньше был «синий экран» на загрузке.
export default defineConfig({
  base: './',                         // относительные пути: работает и на Vercel, и в превью
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2019',
    assetsInlineLimit: 4096,
    rollupOptions: {
      // Две страницы: продукт (index) и внутренняя витрина компонентов (showcase).
      input: { main: 'index.html', showcase: 'showcase.html' },
    },
  },
  // Дев-сервер для live-превью через туннель Cloudflare (preview.sh).
  server: {
    host: '127.0.0.1',
    port: 4321,
    strictPort: true,
    allowedHosts: true,                 // пускаем запросы с домена *.trycloudflare.com
    hmr: { clientPort: 443, protocol: 'wss' },  // HMR ходит через https-туннель (443/wss)
    // Same-origin прокси к AI-ассистенту (бот /kb/ask). Браузер бьёт по /kb/*
    // на своём origin, Vite server-side пробрасывает на бота — CORS бота ни при
    // чём. На проде тот же путь пробрасывает vercel.json → rewrites.
    proxy: {
      '/kb': {
        target: 'https://eastside-bot-kb-bot.up.railway.app',
        changeOrigin: true,
        secure: true,
        proxyTimeout: 90000,            // ответ бота — 15-30с, ждём терпеливо
        timeout: 90000,
      },
    },
  },
});
