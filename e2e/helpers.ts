import { expect, type Page } from '@playwright/test';

// n번째 출발지 입력칸에 검색어를 넣고 첫 자동완성 항목을 Enter 로 고른다
export const pickDeparture = async (page: Page, index: number, keyword: string) => {
  const input = page.getByRole('combobox', { name: `${index + 1}번째 출발지` });
  await input.fill(keyword);
  await expect(page.getByRole('listbox', { name: '역 검색 결과' })).toBeVisible();
  await input.press('Enter');
  await expect(input).toHaveValue(keyword);
};

export const compute = async (page: Page) => {
  await page.getByRole('button', { name: '중간지점 찾기' }).click();
  await expect(resultCard(page)).toBeVisible();
};

export const resultCard = (page: Page) => page.getByRole('heading', { level: 2 });

export const candidateTabs = (page: Page) => page.getByRole('tablist', { name: '중간지점 후보' }).getByRole('tab');
