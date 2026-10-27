import { test, expect } from '../../fixtures/pageFixtures';
import dotenv from 'dotenv';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { executeQuery } from '../../utils/dbClient';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

dotenv.config();

type CustomerRow = RowDataPacket & {
    firstname: string;
    lastname: string;
    email: string;
    status: number;
    date_added: Date | string;
};

function requiredEnvironmentValue(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} must be configured before running this test.`);
    }
    return value;
}

test.describe.configure({ timeout: 120_000 });

test('Customer registration matches Admin and MySQL records @master @regression @end-to-end @db', async ({
    adminCustomerPage,
    homePage,
    registerPage
}) => {
    const adminUsername = requiredEnvironmentValue('ADMIN_USERNAME');
    const adminPassword = requiredEnvironmentValue('ADMIN_PASSWORD');
    const registrationData = {
        firstName: RandomDataUtil.getFirstName(),
        lastName: RandomDataUtil.getLastName(),
        email: `test-${Date.now()}-${RandomDataUtil.getEmail()}`,
        telephone: RandomDataUtil.getPhoneNumber(),
        password: RandomDataUtil.getPassword(12)
    };
    let registrationSubmitted = false;

    try {
        await test.step('1) Register a unique customer through the storefront', async () => {
            await homePage.openRegister();
            expect(await registerPage.isRegisterPageExists(), 'Registration page should be displayed').toBeTruthy();
            await registerPage.completeRegistration(registrationData);
            registrationSubmitted = true;
            expect(
                await registerPage.isAccountCreatedConfirmationVisible(),
                'Registration should display the account-created confirmation'
            ).toBeTruthy();
        });

        await test.step('2) Find and validate the customer in the Admin Portal', async () => {
            await adminCustomerPage.login(adminUsername, adminPassword);
            const customerRow = await adminCustomerPage.searchCustomer(registrationData.email);
            const rowCells = await customerRow.getByRole('cell').allTextContents();

            expect(rowCells[1]?.trim(), 'Admin customer name should match the generated name')
                .toBe(`${registrationData.firstName} ${registrationData.lastName}`);
            expect(rowCells[2]?.trim(), 'Admin customer email should match the generated email')
                .toBe(registrationData.email);
            expect(rowCells[4]?.trim(), 'Admin customer status should be Enabled').toBe('Enabled');

            await adminCustomerPage.openCustomerRecord(customerRow);
            const adminCustomer = await adminCustomerPage.getCustomerDetails();
            expect(adminCustomer.firstName, 'Admin first name should match the generated value')
                .toBe(registrationData.firstName);
            expect(adminCustomer.lastName, 'Admin last name should match the generated value')
                .toBe(registrationData.lastName);
            expect(adminCustomer.email, 'Admin email should match the generated value')
                .toBe(registrationData.email);
            expect(adminCustomer.status, 'Admin customer status should be Enabled').toBe('Enabled');
        });

        await test.step('3) Verify the customer record in MySQL', async () => {
            const customers = await executeQuery<CustomerRow[]>(
                'SELECT firstname, lastname, email, status, date_added FROM oc_customer WHERE email = ?',
                [registrationData.email]
            );

            expect(customers, 'Exactly one customer record should match the registered email').toHaveLength(1);
            const [customer] = customers;
            expect(customer.firstname, 'Database first name should match the generated value')
                .toBe(registrationData.firstName);
            expect(customer.lastname, 'Database last name should match the generated value')
                .toBe(registrationData.lastName);
            expect(customer.email, 'Database email should match the generated value')
                .toBe(registrationData.email);
            expect(customer.status, 'Newly registered customers should have enabled status').toBe(1);
            expect(customer.date_added, 'Database date_added should be populated').toBeTruthy();
        });
    } finally {
        if (registrationSubmitted) {
            await executeQuery<ResultSetHeader>(
                'DELETE FROM oc_customer WHERE email = ?',
                [registrationData.email]
            );
        }
    }
});
