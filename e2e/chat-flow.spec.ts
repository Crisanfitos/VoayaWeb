
import { test, expect } from '@playwright/test';

test('User can complete a chat and see a trip with an image', async ({ page }) => {
    // 1. Go to Plan page
    await page.goto('/plan');

    // 2. Start a chat
    // Assuming there is an input and a send button
    // Adjust selectors based on actual UI
    const input = page.getByRole('textbox').first(); // or specific placeholder
    await input.fill('Quiero un viaje a París de 3 días');
    await input.press('Enter');

    // 3. Wait for chat redirection and AI response
    await page.waitForURL(/\/chats\/.+/);

    // Wait for AI to finish streaming? 
    // Maybe wait for "completed" state or just interact
    // Assuming we need to exchange messages or it auto-completes?
    // User flow says: "The IA determines... sends closing phrase... Client calls complete"
    // This is hard to trigger deterministically with a real AI.
    // We might just look for the "Complete" button if exposed, or simulated.
    // OR we can manually trigger the complete endpoint via API? 
    // No, let's try to converse or check if a "Complete" button appears.
    // If the prompt is "Quiero ir a Paris", AI might ask "Cuando?".
    // We reply "Mañana".

    // Wait for AI response (at least 2 messages: User + AI)
    await expect(page.locator('p.whitespace-pre-wrap')).toHaveCount(2, { timeout: 30000 });
    await expect(page.locator('p.whitespace-pre-wrap').last()).toContainText(/Par[ií]s/i);

    // Send another message to push for completion
    await page.locator('textarea').fill('Mañana, solo 3 días. Confirma y completa el viaje.');
    await page.keyboard.press('Enter');

    // Wait for completion UI (Botones "Reiniciar" y "Confirmar y Buscar")
    await expect(page.getByRole('button', { name: 'Confirmar y Buscar' })).toBeVisible({ timeout: 60000 });

    // 4. Click Confirm
    await page.getByRole('button', { name: 'Confirmar y Buscar' }).click();

    // 5. Wait for redirect to Trip details (or My Trips, depending on flow)
    // Step 4 in plan says: "Redirects to generating plan" -> "/my-trips" or "/trips/:id"
    // Let's wait for URL
    await page.waitForURL(/\/my-trips\/.+/);

    // 6. Verify Image
    // The trip card or hero should have an image.
    const image = page.locator('img').first();
    await expect(image).toBeVisible();

    // Check if src is NOT placeholder
    // Note: Unsplash URLs contain "images.unsplash.com"
    const src = await image.getAttribute('src');
    console.log('Trip Image Source:', src);
    expect(src).toContain('images.unsplash.com');
});
