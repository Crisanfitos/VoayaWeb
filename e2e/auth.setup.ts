
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Perform authentication steps. Replace these actions with your own.
    await page.goto('http://localhost:9002/login');

    // Fill credentials
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('cristianregina13@gmail.com');
    await page.locator('input[name="password"]').fill('cristianregina');

    // Click Login
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    // Or look for "Iniciar Sesión" if in Spanish. 
    // Based on "Fix Register Screen UI" context, it might be Spanish.
    // I'll try generic selector or wait for navigation.

    // Wait for redirect to home or plan
    await page.waitForURL('**/plan');
    // OR check locally
    // await page.waitForURL('http://localhost:9002/plan');

    await page.context().storageState({ path: authFile });
});
