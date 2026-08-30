import { test, expect } from '@playwright/test';

test('Staging Environment Smoke Test', async ({ page }) => {
  // 1. Navigate to the landing page
  await page.goto('/');
  // 2. Verify the brand name is visible
  await expect(page.getByText('Shorten, track', { exact: false })).toBeVisible();
  
  // 3. Navigate to the App subdomain (Dashboard Login)
  await page.goto('/login');
  // 4. Verify the login form renders
  await expect(page.getByText('Log in to your trim account', { exact: false })).toBeVisible();
});
