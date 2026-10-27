import { Locator, Page } from '@playwright/test';

export type AdminCustomerDetails = {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
};

export class AdminCustomerPage {
    private readonly page: Page;
    private readonly adminUrl: string;

    constructor(page: Page, adminUrl: string) {
        this.page = page;
        this.adminUrl = adminUrl;
    }

    async login(username: string, password: string): Promise<void> {
        await this.page.goto(this.adminUrl);
        await this.page.getByRole('textbox', { name: 'Username', exact: true }).fill(username);
        await this.page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
        await this.page.getByRole('button', { name: /Login/ }).click();
        await this.page.waitForURL(url => url.searchParams.get('route') === 'common/dashboard');

        const securityModal = this.page.locator('#modal-security');
        if (await securityModal.isVisible()) {
            await securityModal.locator('button.close').click();
        }
    }

    async searchCustomer(email: string): Promise<Locator> {
        const userToken = new URL(this.page.url()).searchParams.get('user_token');
        if (!userToken) {
            throw new Error('Admin login did not provide a user token.');
        }

        const customersUrl = new URL(this.adminUrl);
        customersUrl.searchParams.set('route', 'customer/customer');
        customersUrl.searchParams.set('user_token', userToken);
        await this.page.goto(customersUrl.toString());
        await this.page.getByPlaceholder('E-Mail', { exact: true }).fill(email);
        await this.page.locator('#button-filter').click();

        const customerRow = this.page.getByRole('row').filter({ hasText: email });
        await customerRow.waitFor({ state: 'visible' });
        return customerRow;
    }

    async openCustomerRecord(customerRow: Locator): Promise<void> {
        await customerRow.locator('a.btn-primary').first().click();
        await this.page.getByPlaceholder('First Name', { exact: true }).waitFor({ state: 'visible' });
    }

    async getCustomerDetails(): Promise<AdminCustomerDetails> {
        return {
            firstName: await this.page.getByPlaceholder('First Name', { exact: true }).inputValue(),
            lastName: await this.page.getByPlaceholder('Last Name', { exact: true }).inputValue(),
            email: await this.page.getByPlaceholder('E-Mail', { exact: true }).inputValue(),
            status: (await this.page.locator('#input-status option:checked').textContent())?.trim() ?? ''
        };
    }
}
