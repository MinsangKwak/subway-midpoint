import { defineConfig, devices } from '@playwright/test';

// 지도 키 없이 빌드한 앱을 preview 서버로 띄우고, 검색·계산·후보·공유 흐름을 브라우저에서 확인한다.
// CI 에서는 VITE_KAKAO_MAP_KEY 를 비워 두므로 지도 대신 안내 문구가 보이는 상태를 검사한다.
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'retain-on-failure',
    locale: 'ko-KR',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    env: { VITE_KAKAO_MAP_KEY: '' },
    timeout: 120_000,
  },
});
