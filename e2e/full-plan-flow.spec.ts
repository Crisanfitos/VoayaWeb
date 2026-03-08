
import { test, expect } from '@playwright/test';
import { format, addDays } from 'date-fns';

test('User can use all plan filters, date pickers, and complete a detailed chat flow', async ({ page }) => {
    // 1. Calculate dates
    const today = new Date();
    const depDate = addDays(today, 7);
    const retDate = addDays(depDate, 15);

    const depDateStr = format(depDate, 'yyyy-MM-dd');
    const retDateStr = format(retDate, 'yyyy-MM-dd');

    // 2. Navigate to Plan page (Authenticated via setup)
    await page.goto('/plan');

    // 3. Interact with Search Category Buttons
    // Toggle 'Hoteles' and 'Experiencias' so all 3 are selected (Flights is default?)
    // Let's check state. Code says default is ['flights'].
    // So click Hotels and Experiences.
    // Using text matching for buttons
    await page.getByRole('button', { name: 'Hoteles' }).click();
    await page.getByRole('button', { name: 'Experiencias' }).click();

    // Verify they are active (class check or check if flight options still visible)
    // Flight options only visible if 'flights' is in set. It defaults to on.
    // If we toggle flights off, options disappear. We want them ON.

    // 4. Interact with Flight Options (Only visible if 'flights' selected)
    // Luggage: Select "Solo mano"
    await page.getByRole('button', { name: 'Solo mano' }).click();

    // Direct Flights: Toggle on
    await page.getByRole('button', { name: 'Solo directos' }).click();

    // Budget Class: Select "Económico"
    await page.getByRole('button', { name: 'Económico' }).click();

    // One Way: Toggle on then off to test, or just leave off to set return date.
    // Requirement: "fechas de ida y de vuelta". So leave One Way OFF.

    // 5. Set Dates
    // We need to interact with the DatePicker.
    // The DatePicker might use a popover.
    // We can try to fill the input if it allows typing, or use the calendar UI.
    // The code uses `DatePicker` component. Let's assume it displays a button that opens a calendar
    // OR strictly the previous file showed: `date={...} setDate={...}`
    // And the trigger might be the button with "Fecha ida".

    // Approach A: Click button "Fecha ida", pick date. Hard to pick exact date "today + 7".
    // Approach B: If the component exposes an input (unlikely if it's typical Shadcn DatePicker), fill it.
    // Approach C: Use `page.evaluate` to force set if strictly needed, but better to use UI.
    // Let's try to click the button and just verify it opens, 
    // OR better: The user requirement implies functionality.
    // Actually, standard DatePicker usually has an input or we can type?
    // If not, we might need to navigate the calendar.
    // "Next month" button clicks might be needed.

    // SIMPLIFICATION:
    // If the DatePicker allows manual entry or we can target a specific day.
    // Let's try to just click the placeholder if it's a button.
    // Wait, the code shows imports from `@/components/ui/date-picker`.
    // Let's assume standard Shadcn behavior: Button opens Popover with Calendar.
    // To avoid complex calendar navigation in this quick test, let's try to find a day button.
    // But strictly matching "today + 7" is dynamic.
    // We can check if we can type.

    // Let's assume we click the trigger and try to click a day that isn't disabled.
    // Just picking *any* valid date might be easier than specific +7 logic via UI selectors.
    // BUT user explicitly asked for "fecha actual más 7 días".

    // Let's try to construct the aria-label or accessible name for the date?
    // `format(depDate, 'PPP')` or similar depending on locale.
    // If locale is Spanish, we need Spanish format.

    // ALTERNATIVE: Use the text input.
    // In `client/src/app/plan/page.tsx`, `DatePicker` implementation is imported.
    // If we can't see `DatePicker` source, we guess.
    // Let's try to type if possible.

    // For now, I will add a placeholder step for dates or try to select by text if possible.
    // I will skip complex date picking if it's too fragile, 
    // BUT the prompt is specific.
    // Let's try to click the button with text "Fecha ida" and then finding a cell.

    // Trigger Departure
    await page.getByRole('button', { name: 'Fecha ida' }).click();
    // We need to click a date.
    // If we can match the day number "15", "20", etc.
    // depDate.getDate().toString()
    const depDay = depDate.getDate().toString();
    // This is risky if today is 30th and 30+7 is next month.
    // If next month, we need to click "Next month".
    if (depDate.getMonth() !== today.getMonth()) {
        await page.getByRole('button', { name: 'Next month' }).click(); // Selector depends on component
    }
    await page.getByRole('gridcell', { name: depDay, exact: true }).first().click();

    // Trigger Return
    await page.getByRole('button', { name: 'Fecha vuelta' }).click();
    // Adjust logic for return date month difference from DEPARTURE date (not today)
    if (retDate.getMonth() !== depDate.getMonth()) {
        await page.getByRole('button', { name: 'Next month' }).click();
    }
    const retDay = retDate.getDate().toString();
    await page.getByRole('gridcell', { name: retDay, exact: true }).first().click();


    // 6. Enter Tip Description and Start Chat
    await page.locator('input[placeholder*="Bali"]').fill('Quiero un viaje a Madrid completo');
    // Click Planificar
    // The `Planificar` button (hidden on mobile, visible on desktop)
    await page.getByRole('button', { name: 'Planificar' }).first().click();

    // 7. Handle Chat Flow
    // Wait for redirect
    await page.waitForURL(/\/chats\/.+/);

    // Wait for AI message
    // Selector from previous fix: p.whitespace-pre-wrap
    await expect(page.locator('p.whitespace-pre-wrap')).toHaveCount(2, { timeout: 45000 });

    // Reply to AI
    await page.locator('textarea').fill('Me parece bien, continúa.');
    await page.keyboard.press('Enter');

    // Wait for potentially another response or just complete
    // Let's force completion if the button appears
    // AI might need a few turns. 
    // To speed up, we can send "Confirma y busca opciones"
    await expect(page.locator('p.whitespace-pre-wrap')).toHaveCount(4, { timeout: 45000 }); // User + AI + User + AI

    await page.locator('textarea').fill('Perfecto, confirma y busca.');
    await page.keyboard.press('Enter');

    // 8. Wait for "Confirmar y Buscar" button to appear (triggered by AI "COMPLETED" state or manual logic)
    // In `chat-completion-controls.tsx`: "Confirmar y Buscar"
    await expect(page.getByRole('button', { name: 'Confirmar y Buscar' })).toBeVisible({ timeout: 60000 });
    await page.getByRole('button', { name: 'Confirmar y Buscar' }).click();

    // 9. Wait for Results (Trip Generation)
    // Should redirect to `/my-trips` or display trip
    // Wait for "Your Travel Plan" or "Viaje a Madrid" header
    // Based on `handleChatComplete`: `setCurrentView('plan')` -> `Your Travel Plan to ...`
    await expect(page.getByText('Your Travel Plan to')).toBeVisible({ timeout: 60000 });

});
