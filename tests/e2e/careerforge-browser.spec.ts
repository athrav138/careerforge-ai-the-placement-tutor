import { expect, test } from '@playwright/test';

test.describe('Offline authentication navigation', () => {
  test('password recovery page provides an email field and submit action', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: /forgot password|reset your password/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link|reset password/i })).toBeVisible();
  });

  test('login and registration expose Google sign-in actions', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();

    await page.goto('/register');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });

  test('all primary protected pages redirect unauthenticated visitors to login', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/onboarding',
      '/dashboard/career',
      '/dashboard/skills',
      '/dashboard/roadmap',
      '/dashboard/resume',
      '/dashboard/aptitude',
      '/dashboard/interview',
      '/dashboard/jobs',
      '/dashboard/settings',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    }
  });
});
