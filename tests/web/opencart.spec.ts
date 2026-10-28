import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';

test.describe.configure({ timeout: 120_000 });

test('Search for a known product @master @sanity @regression @web', async ({ homePage, productSearchPage }) => {
    const { productName } = Helper.getProductDetails();

    await test.step('1) Search for the configured product', async () => {
        await homePage.searchForProduct(productName);
    });

    await test.step('2) Verify the expected product appears in search results', async () => {
        expect(await productSearchPage.isProductDisplayed(productName)).toBeTruthy();
    });

    console.log('✅ Product search completed successfully.');
});

test('Add a product to the shopping cart @master @sanity @regression @web', async ({
    homePage,
    productSearchPage,
    productPage,
    shoppingCartPage
}) => {
    const { productName, productQuantity } = Helper.getProductDetails();

    await test.step('1) Search for the configured product and open its details', async () => {
        await homePage.searchForProduct(productName);
        expect(await productSearchPage.isProductDisplayed(productName)).toBeTruthy();
        await productSearchPage.openProduct(productName);
        expect(await productPage.isProductDetailsDisplayed(productName)).toBeTruthy();
    });

    await test.step('2) Add the requested quantity to the cart', async () => {
        await productPage.setQuantity(productQuantity);
        await productPage.addToCart();
        expect(await productPage.isAddedToCartMessageVisible()).toBeTruthy();
    });

    await test.step('3) Verify the cart product and quantity', async () => {
        await productPage.openShoppingCart();
        expect(await shoppingCartPage.isShoppingCartPageExists()).toBeTruthy();
        expect(await shoppingCartPage.isProductInCart(productName)).toBeTruthy();
        expect(await shoppingCartPage.getProductQuantity(productName)).toBe(productQuantity);
    });

    console.log('✅ Product was added to the shopping cart successfully.');
});
