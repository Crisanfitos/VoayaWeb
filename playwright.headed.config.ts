
import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
    ...baseConfig,
    use: {
        ...baseConfig.use,
        headless: false,
        launchOptions: {
            slowMo: 1000, // Slow down by 1000ms so user can see what's happening
        },
    },
    timeout: 120000,
});
