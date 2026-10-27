import { test as base } from '@playwright/test';
import dotenv from 'dotenv';
import { AdminCustomerPage } from '../pages/AdminCustomerPage';
import { AccountPage } from '../pages/AccountPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { LogoutPage } from '../pages/LogoutPage';
import { ProductPage } from '../pages/ProductPage';
import { ProductSearchPage } from '../pages/ProductSearchPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ShoppingCartPage } from '../pages/ShoppingCartPage';

dotenv.config();

const APP_URL = process.env.WEB_APP_URL;

if (!APP_URL) {
    throw new Error('WEB_APP_URL must be configured before running web tests.');
}

type PageFixtures = {
    adminCustomerPage: AdminCustomerPage;
    accountPage: AccountPage;
    homePage: HomePage;
    loginPage: LoginPage;
    logoutPage: LogoutPage;
    productPage: ProductPage;
    productSearchPage: ProductSearchPage;
    registerPage: RegisterPage;
    shoppingCartPage: ShoppingCartPage;
};

export const test = base.extend<PageFixtures>({
    adminCustomerPage: async ({ page }, use) => {
        await use(new AdminCustomerPage(page, new URL('admin/index.php', APP_URL).toString()));
    },
    accountPage: async ({ page }, use) => {
        await use(new AccountPage(page));
    },
    homePage: async ({ page }, use) => {
        await page.goto(APP_URL);
        await use(new HomePage(page));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    logoutPage: async ({ page }, use) => {
        await use(new LogoutPage(page));
    },
    productPage: async ({ page }, use) => {
        await use(new ProductPage(page));
    },
    productSearchPage: async ({ page }, use) => {
        await use(new ProductSearchPage(page));
    },
    registerPage: async ({ page }, use) => {
        await use(new RegisterPage(page));
    },
    shoppingCartPage: async ({ page }, use) => {
        await use(new ShoppingCartPage(page));
    }
});

test.afterEach(async ({ page, context }) => {
    if (!page.isClosed()) {
        await page.close();
    }
    await context.close();
});

export { expect } from '@playwright/test';
