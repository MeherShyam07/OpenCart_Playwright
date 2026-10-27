import { Locator, Page } from '@playwright/test';
import { HomePage } from './HomePage';

export class LogoutPage {
    private readonly page: Page;

    // Locators
    private readonly headingLogout: Locator;
    private readonly linkContinue: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingLogout = page.getByRole('heading', { name: 'Account Logout', exact: true });
        this.linkContinue = page.getByRole('link', { name: 'Continue', exact: true });
    }

    /**
     * Verifies the logout confirmation is displayed.
     * @returns Promise<boolean> - true when the logout heading is visible
     */
    async isLogoutConfirmationExists(): Promise<boolean> {
        await this.headingLogout.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Continues from the logout confirmation to the storefront home page.
     * @returns Promise<HomePage> - Storefront home page object
     */
    async clickContinue(): Promise<HomePage> {
        await this.linkContinue.click();
        return new HomePage(this.page);
    }
}
