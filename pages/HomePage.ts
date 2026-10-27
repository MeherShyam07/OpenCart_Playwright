import { Locator, Page } from '@playwright/test';

export class HomePage {
    private readonly page: Page;

    // Locators
    private readonly linkMyAccount: Locator;
    private readonly linkRegister: Locator;
    private readonly linkLogin: Locator;
    private readonly linkLogout: Locator;
    private readonly txtSearch: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.linkMyAccount = page.getByRole('link', { name: /My Account/ }).first();
        this.linkRegister = page.getByRole('link', { name: 'Register', exact: true });
        this.linkLogin = page.getByRole('link', { name: 'Login', exact: true });
        this.linkLogout = page.getByRole('link', { name: 'Logout', exact: true });
        this.txtSearch = page.getByRole('textbox', { name: 'Search', exact: true });
    }

    /**
     * Opens the My Account menu.
     */
    async clickMyAccount(): Promise<void> {
        await this.linkMyAccount.click();
    }

    /**
     * Opens the customer registration page from My Account.
     */
    async openRegister(): Promise<void> {
        await this.clickMyAccount();
        await this.linkRegister.click();
    }

    /**
     * Opens the customer login page from My Account.
     */
    async openLogin(): Promise<void> {
        await this.clickMyAccount();
        await this.linkLogin.click();
    }

    /**
     * Searches the storefront for a product.
     * @param productName - Product name to search for
     */
    async searchForProduct(productName: string): Promise<void> {
        await this.txtSearch.fill(productName);
        await this.txtSearch.press('Enter');
    }

    /**
     * Checks that guest account options are available and logout is not.
     * @returns Promise<boolean> - true when guest navigation is displayed
     */
    async isLoggedOutNavigationVisible(): Promise<boolean> {
        await this.clickMyAccount();
        return (await this.linkLogin.isVisible())
            && (await this.linkRegister.isVisible())
            && !(await this.linkLogout.isVisible());
    }
}
