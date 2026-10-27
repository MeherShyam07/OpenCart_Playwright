import { Locator, Page } from '@playwright/test';

export type RegistrationData = {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
};

export class RegisterPage {
    private readonly page: Page;

    // Locators
    private readonly headingRegister: Locator;
    private readonly txtFirstName: Locator;
    private readonly txtLastName: Locator;
    private readonly txtEmail: Locator;
    private readonly txtTelephone: Locator;
    private readonly txtPassword: Locator;
    private readonly txtPasswordConfirm: Locator;
    private readonly chkPrivacyPolicy: Locator;
    private readonly btnContinue: Locator;
    private readonly headingAccountCreated: Locator;
    private readonly linkContinue: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingRegister = page.getByRole('heading', { name: 'Register Account', exact: true });
        this.txtFirstName = page.getByPlaceholder('First Name', { exact: true });
        this.txtLastName = page.getByPlaceholder('Last Name', { exact: true });
        this.txtEmail = page.getByPlaceholder('E-Mail', { exact: true });
        this.txtTelephone = page.getByPlaceholder('Telephone', { exact: true });
        this.txtPassword = page.getByPlaceholder('Password', { exact: true });
        this.txtPasswordConfirm = page.getByPlaceholder('Password Confirm', { exact: true });
        this.chkPrivacyPolicy = page.getByRole('checkbox');
        this.btnContinue = page.getByRole('button', { name: 'Continue', exact: true });
        this.headingAccountCreated = page.getByRole('heading', { name: 'Your Account Has Been Created!', exact: true });
        this.linkContinue = page.getByRole('link', { name: 'Continue', exact: true });
    }

    /**
     * Verifies the registration page is displayed.
     * @returns Promise<boolean> - true when the registration heading is visible
     */
    async isRegisterPageExists(): Promise<boolean> {
        await this.headingRegister.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Completes and submits the customer registration form.
     * @param registrationData - Customer details to register
     */
    async completeRegistration(registrationData: RegistrationData): Promise<void> {
        await this.txtFirstName.fill(registrationData.firstName);
        await this.txtLastName.fill(registrationData.lastName);
        await this.txtEmail.fill(registrationData.email);
        await this.txtTelephone.fill(registrationData.telephone);
        await this.txtPassword.fill(registrationData.password);
        await this.txtPasswordConfirm.fill(registrationData.password);
        await this.chkPrivacyPolicy.check();
        await this.btnContinue.click();
    }

    /**
     * Verifies the account-created confirmation is displayed.
     * @returns Promise<boolean> - true when registration succeeds
     */
    async isAccountCreatedConfirmationVisible(): Promise<boolean> {
        await this.headingAccountCreated.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Continues from the account-created page to the account dashboard.
     */
    async clickContinue(): Promise<void> {
        await this.linkContinue.click();
    }
}
