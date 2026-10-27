import { expect, test } from '@playwright/test';
import { compute, pickDeparture, resultCard } from './helpers';

test('모바일에서는 계산 후 하단 패널이 접히고 손잡이로 다시 펼친다', async ({ page }) => {
  await page.goto('/');
  const handle = page.getByRole('button', { name: /패널 (접기|펼치기)/ });
  await expect(handle).toBeVisible();
  await expect(handle).toHaveAttribute('aria-expanded', 'true');

  await pickDeparture(page, 0, '서울대입구');
  await pickDeparture(page, 1, '강남');
  await compute(page);
  await expect(handle).toHaveAttribute('aria-expanded', 'false');

  await handle.click();
  await expect(handle).toHaveAttribute('aria-expanded', 'true');
  await expect(resultCard(page)).toBeInViewport();
});

test('모바일 화면에서 가로 스크롤이 생기지 않는다', async ({ page }) => {
  await page.goto('/?from=강남,홍대입구');
  await expect(resultCard(page)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
