import { test, expect } from '@playwright/test';

/**
 * E2E test for Story 9.3: SSE cross-tab real-time updates.
 *
 * Required environment:
 *   - E2E_TEST_EMAIL
 *   - E2E_TEST_PASSWORD
 *
 * This test verifies that creating a task in one browser tab causes it to
 * appear in another tab within 2 seconds, powered by SSE push updates.
 */

function requireEnv(name: 'E2E_TEST_EMAIL' | 'E2E_TEST_PASSWORD'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for e2e auth`);
  }
  return value;
}

async function waitForTasksPageReady(page: import('@playwright/test').Page) {
  await page.waitForURL(/\/tasks(?:\?.*)?$/, { timeout: 10_000 });

  const readyControls = page.locator(
    'button:has-text("New Task"), input[placeholder="Search tasks..."]',
  );
  await expect(readyControls.first()).toBeVisible({ timeout: 10_000 });
}

async function login(page: import('@playwright/test').Page) {
  const testEmail = requireEnv('E2E_TEST_EMAIL');
  const testPassword = requireEnv('E2E_TEST_PASSWORD');

  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', testEmail);
  await page.fill('input[name="password"], input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(tasks|dashboard)(?:\?.*)?$/, { timeout: 10_000 });
}

test.describe('SSE cross-tab real-time updates', () => {
  test('task created in tab A appears in tab B within 2 seconds', async ({
    browser,
  }) => {
    // Use one browser context to simulate two tabs in the same session.
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    try {
      // Login once, then verify both tabs share the same authenticated session.
      await login(pageA);

      await pageA.goto('/tasks');
      await pageB.goto('/tasks');
      await waitForTasksPageReady(pageA);
      await waitForTasksPageReady(pageB);

      // Create a unique task title to identify it
      const taskTitle = `SSE-test-${Date.now()}`;

      // Keep tab A focused while tab B stays in the background.
      await pageA.bringToFront();

      // Create task in tab A using the quick-add bar or create button
      const createButton = pageA.locator('button:has-text("New Task")');
      if (await createButton.isVisible()) {
        await createButton.click();
      }

      // Fill in task title in the create form/panel
      const titleInput = pageA.locator(
        'input[placeholder*="task"], input[name="title"], textarea[placeholder*="task"]',
      );
      await titleInput.waitFor({ state: 'visible', timeout: 5_000 });
      await titleInput.fill(taskTitle);

      // Submit the task
      const submitButton = pageA.locator(
        'button[type="submit"], button:has-text("Create"), button:has-text("Add")',
      );
      await submitButton.click();

      // Wait for the task to appear in tab B within 2 seconds (SSE delivery)
      const taskInTabB = pageB.locator(`text=${taskTitle}`);
      await expect(taskInTabB).toBeVisible({ timeout: 2_000 });
    } finally {
      await context.close();
    }
  });
});
