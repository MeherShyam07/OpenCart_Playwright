import { Locator, Page } from '@playwright/test';
import { LogoutPage } from './LogoutPage';

export class AccountPage {
    private readonly page: Page;

    // Locators
    private readonly headingMyAccount: Locator;
    private readonly linkLogout: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingMyAccount = page.getByRole('heading', { name: 'My Account', exact: true, level: 2 }).first();
        this.linkLogout = page.getByRole('link', { name: 'Logout', exact: true });
    }

    /**
     * Verifies the authenticated My Account dashboard is displayed.
     * @returns Promise<boolean> - true when the dashboard heading is visible
     */
    async isMyAccountPageExists(): Promise<boolean> {
        await this.headingMyAccount.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Checks whether the authenticated My Account dashboard is currently visible.
     * @returns Promise<boolean> - true when the dashboard heading is visible
     */
    async isMyAccountPageVisible(): Promise<boolean> {
        return this.headingMyAccount.isVisible();
    }

    /**
     * Logs the customer out.
     * @returns Promise<LogoutPage> - Logout confirmation page object
     */
    async clickLogout(): Promise<LogoutPage> {
        await this.linkLogout.click();
        return new LogoutPage(this.page);
    }
}
