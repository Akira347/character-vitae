// playwright/tests/drag-and-add.spec.ts
import { test, expect } from '@playwright/test';

test('login, add section from palette and see it on canvas', async ({ page }) => {
  // change to your dev URL
  await page.goto('http://localhost:5173');

  // Open login modal
  await page.click('img[alt="Connexion"]');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');

  // wait navigation to dashboard
  await page.waitForURL('**/dashboard');

  // Ensure palette present and click add on the first available type button
  await page.click('button.btn-parchment'); // adjust selector if needed

  // Wait for the new section to appear in the canvas
  const headerLocators = page.locator('.section-container .section-header h5');
  // count() returns a Promise<number>
  const count = await headerLocators.count();
  expect(count).toBeGreaterThan(0);
});
