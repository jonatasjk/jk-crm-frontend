import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:3001/api/v1';

/** Complete the login flow and set up API mocks */
async function loginAndMockApis(page: Page) {
  // Mock API responses
  await page.route(`${BASE}/auth/login`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'test-e2e-token',
        user: { id: '1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' },
      }),
    });
  });

  const mockInvestors = [
    {
      id: 'inv-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      stage: 'PROSPECT',
      tags: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  await page.route(`${BASE}/investors**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockInvestors, total: 1, page: 1, limit: 200, pages: 1 }),
    });
  });

  await page.route(`${BASE}/partners**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0, page: 1, limit: 200, pages: 0 }),
    });
  });

  await page.route(`${BASE}/email/stats`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sentToday: 7 }),
    });
  });

  await page.route(`${BASE}/email/logs`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route(`${BASE}/sequences**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route(`${BASE}/materials**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Login
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Navigation', () => {
  test('authenticated user can navigate to Investors page', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Investors' }).first().click();
    await expect(page).toHaveURL(/\/investors/);
    await expect(page.getByRole('heading', { name: 'Investors' })).toBeVisible();
  });

  test('authenticated user can navigate to Partners page', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Partners' }).first().click();
    await expect(page).toHaveURL(/\/partners/);
    await expect(page.getByRole('heading', { name: 'Partners' })).toBeVisible();
  });

  test('authenticated user can navigate to Emails page', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Emails' }).first().click();
    await expect(page).toHaveURL(/\/emails/);
    await expect(page.getByText('Email Log')).toBeVisible();
  });

  test('authenticated user can navigate to Sequences page', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Sequences' }).first().click();
    await expect(page).toHaveURL(/\/sequences/);
    await expect(page.getByRole('heading', { name: 'Sequences' })).toBeVisible();
  });

  test('authenticated user can navigate to Materials page', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Materials' }).first().click();
    await expect(page).toHaveURL(/\/materials/);
    await expect(page.getByRole('heading', { name: 'Materials', level: 1 })).toBeVisible();
  });

  test('dashboard shows navigation sidebar', async ({ page }) => {
    await loginAndMockApis(page);
    await expect(page.getByText('JK CRM').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Investors' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Partners' }).first()).toBeVisible();
  });

  test('active navigation link is highlighted', async ({ page }) => {
    await loginAndMockApis(page);
    // On dashboard, Dashboard nav link should be active (indigo background)
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' }).first();
    await expect(dashboardLink).toHaveClass(/bg-indigo-600/);
  });

  test('can navigate back to dashboard via nav link', async ({ page }) => {
    await loginAndMockApis(page);
    // Go to investors first
    await page.getByRole('link', { name: 'Investors' }).first().click();
    await expect(page).toHaveURL(/\/investors/);
    // Navigate back to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Investors page interactions', () => {
  test('shows investor list view', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Investors' }).first().click();
    await expect(page).toHaveURL(/\/investors/);

    // Switch to list view
    await page.getByTitle('List view').click();
    await expect(page.getByText('Alice Smith')).toBeVisible();
  });

  test('opens create investor modal', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Investors' }).first().click();
    await page.getByRole('button', { name: /add investor/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add investor' })).toBeVisible();
  });

  test('can close create investor modal with Cancel', async ({ page }) => {
    await loginAndMockApis(page);
    await page.getByRole('link', { name: 'Investors' }).first().click();
    await page.getByRole('button', { name: /add investor/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
