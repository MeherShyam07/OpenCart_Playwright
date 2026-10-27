import { Locator, Page } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;

    // Locators
    private readonly headingLogin: Locator;
    private readonly txtEmail: Locator;
    private readonly txtPassword: Locator;
    private readonly btnLogin: Locator;
    private readonly txtWarning: Locator;
    private readonly linkLogout: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingLogin = page.getByRole('heading', { name: 'Returning Customer', exact: true });
        this.txtEmail = page.getByRole('textbox', { name: 'E-Mail Address', exact: true });
        this.txtPassword = page.getByRole('textbox', { name: 'Password', exact: true });
        this.btnLogin = page.getByRole('button', { name: 'Login', exact: true });
        this.txtWarning = page.getByText('Warning: No match for E-Mail Address and/or Password.', { exact: true });
        this.linkLogout = page.getByRole('link', { name: 'Logout', exact: true });
    }

    /**
     * Verifies the login page is displayed.
     * @returns Promise<boolean> - true when the login heading is visible
     */
    async isLoginPageExists(): Promise<boolean> {
        await this.headingLogin.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Submits the supplied customer credentials.
     * @param email - Customer email address
     * @param password - Customer password
     */
    async login(email: string, password: string): Promise<void> {
        await this.txtEmail.fill(email);
        await this.txtPassword.fill(password);
        await this.btnLogin.click();
    }

    /**
     * Verifies the OpenCart credential warning is displayed.
     * @returns Promise<boolean> - true when the login warning is visible
     */
    async isWarningMessageVisible(): Promise<boolean> {
        await this.txtWarning.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Checks whether the current page exposes an authenticated logout option.
     * @returns Promise<boolean> - true when a logout link is visible
     */
    async isLogoutLinkVisible(): Promise<boolean> {
        return this.linkLogout.isVisible();
    }
}
