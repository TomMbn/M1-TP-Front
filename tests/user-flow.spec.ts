import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
    // Clear local storage before each test to simulate a new user
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('full journey: create profile and create room', async ({ page }) => {
        // 1. Initial State: Should see "Créer mon profil"
        await expect(page.getByRole('button', { name: /Créer mon profil/i })).toBeVisible();

        // 2. Navigate to Create Profile
        await page.getByRole('button', { name: /Créer mon profil/i }).click();
        await expect(page).toHaveURL('/create-profile');

        // 3. Fill Profile Form
        await page.fill('input[id="pseudo"]', 'TestUser');
        // Skip photo upload for basic flow, it's optional
        await page.click('button[type="submit"]');

        // 4. Verify Redirect & Profile State
        await expect(page).toHaveURL('/');

        // Check if profile is saved in local storage (optional verification)
        const storedUser = await page.evaluate(() => localStorage.getItem('chat_user'));
        expect(storedUser).toBeTruthy();
        expect(JSON.parse(storedUser!).pseudo).toBe('TestUser');

        // 5. Verify Homepage Updated State
        await expect(page.getByText('TestUser')).toBeVisible();
        await expect(page.getByRole('button', { name: /Créer une salle/i })).toBeVisible();

        // 6. Create Room Interaction
        // Mock window.prompt
        page.on('dialog', async dialog => {
            expect(dialog.type()).toBe('prompt');
            await dialog.accept('MyNewRoom');
        });

        await page.getByRole('button', { name: /Créer une salle/i }).click();

        // 7. Verify Navigation to Room
        // Encoding 'MyNewRoom' might not change it, but good practice to expect dynamic URL
        await expect(page).toHaveURL(/\/room\/MyNewRoom/);

        // Verify room elements
        await expect(page.locator('header').getByText('MyNewRoom', { exact: true })).toBeVisible();
    });

    test('navigation validation', async ({ page }) => {
        // Test direct access protection or redirection if needed
        // For now, just verifying "Galerie" button exists after profile creation

        // Setup profile
        await page.evaluate(() => {
            localStorage.setItem('chat_user', JSON.stringify({ pseudo: 'GalleryUser', photo: null }));
        });
        await page.reload();

        await expect(page.getByRole('button', { name: /Galerie/i })).toBeVisible();
        await page.getByRole('button', { name: /Galerie/i }).click();
        await expect(page).toHaveURL('/gallery');
    });
});
