import { expect, test } from '@playwright/test';

test.describe('Public authentication pages', () => {
  test('homepage presents the CareerForge product and registration action', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/CareerForge/i);
    await expect(page.getByRole('link', { name: /start your placement journey/i })).toBeVisible();
  });

  test('registration action opens the registration page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /start your placement journey/i }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('registration page exposes all required form fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    for (const name of ['name', 'email', 'password', 'confirmPassword']) {
      await expect(page.locator(`input[name="${name}"]`)).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('login page exposes email/password sign-in and recovery links', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
    await expect(page.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/register');
  });

  test('an unauthenticated browser is redirected away from the dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});
