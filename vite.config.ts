import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// 기본 빌드(`vite build`)는 루트 경로라 Vercel 에서 그대로 쓴다.
// GitHub Pages 는 `/subway-midpoint/` 하위 경로이므로 `--mode pages` 일 때만 base 를 바꾼다.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' ? '/subway-midpoint/' : '/',
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
