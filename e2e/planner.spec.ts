import { expect, test } from '@playwright/test';
import { candidateTabs, compute, pickDeparture, resultCard } from './helpers';

test.describe('검색과 계산', () => {
  test('지도 키가 없어도 검색·계산·결과 카드를 쓸 수 있다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    await expect(page.getByRole('status')).toContainText('카카오맵 키가 없어');

    await pickDeparture(page, 0, '금정');
    await pickDeparture(page, 1, '강남');
    await compute(page);

    await expect(resultCard(page)).toContainText('선바위');
    await expect(candidateTabs(page)).toHaveCount(3);
    await expect(candidateTabs(page).first()).toHaveAttribute('aria-selected', 'true');
    // 출발지별 시간·환승 행이 두 줄 있다
    await expect(page.getByText(/환승 (없음|\d+회)/)).toHaveCount(2);
    expect(errors).toEqual([]);
  });

  test('후보를 바꾸면 선택 상태와 주소의 pick 이 함께 바뀐다', async ({ page }) => {
    await page.goto('/');
    await pickDeparture(page, 0, '금정');
    await pickDeparture(page, 1, '강남');
    await compute(page);
    await expect(page).toHaveURL(/\?from=/);
    await expect(page).not.toHaveURL(/pick=/);

    const second = candidateTabs(page).nth(1);
    const name = (await second.textContent())!.replace(/\d+분$/, '').trim();
    await second.click();
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(resultCard(page)).toContainText(name);
    await expect(page).toHaveURL(/pick=1/);
  });

  test('출발역을 고치면 이전 결과와 주소의 조건이 사라진다', async ({ page }) => {
    await page.goto('/');
    await pickDeparture(page, 0, '금정');
    await pickDeparture(page, 1, '강남');
    await compute(page);

    await page.getByRole('combobox', { name: '1번째 출발지' }).fill('금');
    await expect(resultCard(page)).toHaveCount(0);
    await expect(page).not.toHaveURL(/from=/);
    await expect(page.getByRole('button', { name: '중간지점 찾기' })).toBeDisabled();
  });

  test('같은 역을 두 번 고르면 계산할 수 없다', async ({ page }) => {
    await page.goto('/');
    await pickDeparture(page, 0, '강남');
    const input = page.getByRole('combobox', { name: '2번째 출발지' });
    await input.fill('강남');
    const option = page.getByRole('option', { name: /강남/ }).first();
    await expect(option).toHaveAttribute('aria-disabled', 'true');
    await expect(option).toContainText('선택됨');
    await expect(page.getByRole('button', { name: '중간지점 찾기' })).toBeDisabled();
  });
});

test.describe('주소 복원과 공유', () => {
  test('공유 주소로 열면 출발역이 채워지고 결과가 바로 나온다', async ({ page }) => {
    await page.goto('/?from=강남,홍대입구&pick=1');
    await expect(page.getByRole('combobox', { name: '1번째 출발지' })).toHaveValue('강남');
    await expect(page.getByRole('combobox', { name: '2번째 출발지' })).toHaveValue('홍대입구');
    await expect(resultCard(page)).toBeVisible();
    await expect(candidateTabs(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  });

  test('모르는 역이나 역 하나뿐인 주소는 계산하지 않고 입력만 채운다', async ({ page }) => {
    await page.goto('/?from=강남,없는역');
    await expect(page.getByRole('combobox', { name: '1번째 출발지' })).toHaveValue('강남');
    await expect(page.getByRole('combobox', { name: '2번째 출발지' })).toHaveValue('');
    await expect(resultCard(page)).toHaveCount(0);
  });

  test('공유 버튼은 결과 텍스트와 복원 주소를 클립보드에 넣는다', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', '클립보드 권한은 Chromium 에서만 부여할 수 있다');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/?from=강남,홍대입구');
    await expect(resultCard(page)).toBeVisible();

    await page.getByRole('button', { name: '결과 공유' }).click();
    await expect(page.getByRole('button', { name: '복사됨' })).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toMatch(/^중간지점: .+역 \(.+\)\n- 강남 → .+\n- 홍대입구 → .+\n/);
    expect(text).toContain(`${new URL(page.url()).origin}/?from=`);
  });
});

test.describe('접근성 기본', () => {
  test('자동완성은 combobox·listbox 상태를 노출하고 방향키로 고를 수 있다', async ({ page }) => {
    await page.goto('/');
    const input = page.getByRole('combobox', { name: '1번째 출발지' });
    await input.fill('동대문');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await input.press('ArrowDown');
    const active = await input.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    await expect(page.locator(`#${active}`)).toHaveAttribute('aria-selected', 'true');
    await input.press('Enter');
    await expect(input).toHaveValue('동대문역사문화공원');
  });

  test('후보 칩은 방향키로 옮겨 다닐 수 있다', async ({ page }) => {
    await page.goto('/?from=강남,홍대입구');
    const tabs = candidateTabs(page);
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(page).not.toHaveURL(/pick=/);
  });

  test('아이콘 버튼은 접근성 이름을 가진다', async ({ page }) => {
    await page.goto('/?from=강남,홍대입구');
    await expect(page.getByRole('button', { name: '결과 공유' })).toBeVisible();
    await expect(page.getByRole('button', { name: '입력 지우기' })).toHaveCount(2);
  });
});
