import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// 기본 빌드(`vite build`)는 루트 경로라 Vercel 에서 그대로 쓴다.
// GitHub Pages 는 하위 경로이므로 mode 로 base 를 고른다.
//   --mode pages      → /subway-midpoint/      (main, 운영)
//   --mode pages-dev  → /subway-midpoint/dev/  (dev, 미리보기)
const BASE_BY_MODE: Record<string, string> = {
  pages: '/subway-midpoint/',
  'pages-dev': '/subway-midpoint/dev/',
};

export default defineConfig(({ mode }) => ({
  plugins: [react()],
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
