import path from 'path';
import { test, expect } from '../../fixtures/pageFixtures';
import { DataProvider } from '../../utils/DataReader';

type LoginTestData = {
    testName?: string;
    TestName?: string;
    email: string;
    password: string;
    expected: 'success' | 'failure';
};

const loginTestData: LoginTestData[] = DataProvider.readJson(
    path.join(__dirname, '../../testdata/opencart_logindata.json')
);

for (const [index, row] of loginTestData.entries()) {
    const testName = row.testName?.trim() || row.TestName?.trim() || `Login data row ${index + 1}`;
    const email = row.email.trim() ? row.email : '';
    const password = row.password.trim() ? row.password : '';

    test(`${testName} (row ${index + 1}) @master @regression @web @datadriven`, async ({ homePage, loginPage, accountPage }) => {
        await test.step('1) Open the OpenCart login page', async () => {
            await homePage.openLogin();
            expect(await loginPage.isLoginPageExists()).toBeTruthy();
        });

        await test.step('2) Submit the external test data credentials', async () => {
            await loginPage.login(email, password);
        });

        await test.step('3) Validate the result for this data row', async () => {
            if (row.expected === 'success') {
                expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
            } else {
                expect(await loginPage.isWarningMessageVisible()).toBeTruthy();
                expect(await accountPage.isMyAccountPageVisible()).toBeFalsy();
            }
        });

        console.log(`✅ Data-driven login scenario "${testName}" completed.`);
    });
}
