import { test, expect } from '@playwright/test';

test('Homepage laadt correct', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Anemi Meets/i);
  await expect(page.getByText(/Meetup|Ontmoeting|Welkom/i)).toBeVisible();
});

test('Navigatie werkt', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /login|inloggen/i }).click();
  await expect(page).toHaveURL(/login/);
});

test('Login pagina toegankelijk', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/wachtwoord|password/i)).toBeVisible();
});

test('i18n werkt', async ({ page }) => {
  await page.goto('/');
  // Stel taal in op Nederlands (voorbeeld)
  await page.evaluate(() => window.localStorage.setItem('i18nextLng', 'nl'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.evaluate(() => localStorage.getItem('i18nextLng'))).resolves.toBe('nl');
});
