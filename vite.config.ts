import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// 기본 빌드(`vite build`)는 루트 경로라 Vercel 에서 그대로 쓴다.
// GitHub Pages 는 하위 경로이므로 mode 로 base 를 고른다.
//   --mode pages      → /subway-midpoint/      (main, 운영)
//   --mode pages-dev  → /subway-midpoint/dev/  (dev, 미리보기)
const BASE_BY_MODE: Record<string, string> = {
  pages: '/subway-midpoint/',
  'pages-dev': '/subway-midpoint/dev/',
};

// og:url·og:image 는 절대 주소여야 한다. Pages 모드는 저장소 주소, 그 밖에는 VITE_SITE_URL 로 받는다
const SITE_URL_BY_MODE: Record<string, string> = {
  pages: 'https://minsangkwak.github.io/subway-midpoint/',
  'pages-dev': 'https://minsangkwak.github.io/subway-midpoint/dev/',
};

const siteUrlPlugin = (siteUrl: string): Plugin => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
});

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    siteUrlPlugin(SITE_URL_BY_MODE[mode] ?? process.env.VITE_SITE_URL ?? SITE_URL_BY_MODE.pages),
  ],
  base: BASE_BY_MODE[mode] ?? '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
