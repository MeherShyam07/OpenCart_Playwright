import { test, expect } from '../../fixtures/pageFixtures';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Helper } from '../../utils/helper';

test.describe.configure({ timeout: 120_000 });

test.use({ screenshot: 'off', video: 'off', trace: 'off' });

test.afterEach(async ({ page }) => {
    await page.close();
});

test('Customer registration @master @sanity @regression @web', async ({ homePage, registerPage, accountPage }) => {
    const registrationData = {
        firstName: RandomDataUtil.getFirstName(),
        lastName: RandomDataUtil.getLastName(),
        email: `test-${Date.now()}-${RandomDataUtil.getEmail()}`,
        telephone: RandomDataUtil.getPhoneNumber(),
        password: RandomDataUtil.getPassword(12)
    };

    await test.step('1) Navigate to the registration page', async () => {
        await homePage.openRegister();
        expect(await registerPage.isRegisterPageExists()).toBeTruthy();
    });

    await test.step('2) Register a unique customer and verify confirmation', async () => {
        await registerPage.completeRegistration(registrationData);
        expect(await registerPage.isAccountCreatedConfirmationVisible()).toBeTruthy();
    });

    await test.step('3) Verify the new account is available in account navigation', async () => {
        await registerPage.clickContinue();
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
    });

    console.log('Customer registration completed successfully.');
});

test('Invalid customer login is rejected @master @sanity @regression @web', async ({ homePage, loginPage }) => {
    const email = RandomDataUtil.getEmail();
    const password = RandomDataUtil.getPassword();

    await test.step('1) Navigate to the login page', async () => {
        await homePage.openLogin();
        expect(await loginPage.isLoginPageExists()).toBeTruthy();
    });

    await test.step('2) Submit invalid customer credentials', async () => {
        await loginPage.login(email, password);
    });

    await test.step('3) Verify the warning and confirm the customer is not authenticated', async () => {
        expect(await loginPage.isWarningMessageVisible()).toBeTruthy();
        expect(await loginPage.isLogoutLinkVisible()).toBeFalsy();
    });

    console.log('Invalid customer login was rejected as expected.');
});

test('Valid customer login @master @sanity @regression @web', async ({ homePage, loginPage, accountPage }) => {
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Navigate to the login page', async () => {
        await homePage.openLogin();
        expect(await loginPage.isLoginPageExists()).toBeTruthy();
    });

    await test.step('2) Sign in with configured customer credentials', async () => {
        await loginPage.login(email, password);
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
    });

    console.log('Valid customer login completed successfully.');
});

test('Customer logout @master @sanity @regression @web', async ({ homePage, loginPage, accountPage, logoutPage }) => {
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Sign in with configured customer credentials', async () => {
        await homePage.openLogin();
        await loginPage.login(email, password);
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step('2) Log out and verify the confirmation page', async () => {
        await accountPage.clickLogout();
        expect(await logoutPage.isLogoutConfirmationExists()).toBeTruthy();
    });

    await test.step('3) Continue to the home page and verify guest navigation', async () => {
        const homePageAfterLogout = await logoutPage.clickContinue();
        expect(await homePageAfterLogout.isLoggedOutNavigationVisible()).toBeTruthy();
    });

    console.log('Customer logout completed successfully.');
});

test('End-to-end customer shopping journey @master @regression @web @end-to-end', async ({
    homePage,
    registerPage,
    accountPage,
    loginPage,
    productSearchPage,
    productPage,
    shoppingCartPage
}) => {
    const registrationData = {
        firstName: RandomDataUtil.getFirstName(),
        lastName: RandomDataUtil.getLastName(),
        email: `test-${Date.now()}-${RandomDataUtil.getEmail()}`,
        telephone: RandomDataUtil.getPhoneNumber(),
        password: RandomDataUtil.getPassword(12)
    };
    const { productName, productQuantity, totalPrice } = Helper.getProductDetails();

    await test.step('1) Register a new customer', async () => {
        await homePage.openRegister();
        await registerPage.completeRegistration(registrationData);
        expect(await registerPage.isAccountCreatedConfirmationVisible()).toBeTruthy();
        await registerPage.clickContinue();
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step('2) Log out and sign back in with the new credentials', async () => {
        const logoutPage = await accountPage.clickLogout();
        expect(await logoutPage.isLogoutConfirmationExists()).toBeTruthy();
        await logoutPage.clickContinue();
        await homePage.openLogin();
        await loginPage.login(registrationData.email, registrationData.password);
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step('3) Search for the product and add it to the cart', async () => {
        await homePage.searchForProduct(productName);
        expect(await productSearchPage.isProductDisplayed(productName)).toBeTruthy();
        await productSearchPage.openProduct(productName);
        expect(await productPage.isProductDetailsDisplayed(productName)).toBeTruthy();
        await productPage.setQuantity(productQuantity);
        await productPage.addToCart();
        expect(await productPage.isAddedToCartMessageVisible()).toBeTruthy();
        await productPage.openShoppingCart();
    });

    await test.step('4) Verify cart product, quantity, price, and total', async () => {
        expect(await shoppingCartPage.isShoppingCartPageExists()).toBeTruthy();
        expect(await shoppingCartPage.isProductInCart(productName)).toBeTruthy();
        expect(await shoppingCartPage.getProductQuantity(productName)).toBe(productQuantity);
        expect(await shoppingCartPage.getProductRowText(productName)).toContain(totalPrice);
        expect(await shoppingCartPage.getGrandTotalRowText()).toContain(totalPrice);
    });

    console.log('End-to-end customer shopping journey completed successfully.');
});
