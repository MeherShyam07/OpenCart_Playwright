import { Locator, Page } from '@playwright/test';
import { ShoppingCartPage } from './ShoppingCartPage';

export class ProductPage {
    private readonly page: Page;

    // Locators
    private readonly headingProduct: Locator;
    private readonly txtQuantity: Locator;
    private readonly btnAddToCart: Locator;
    private readonly txtAddedToCartMessage: Locator;
    private readonly linkShoppingCart: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingProduct = page.getByRole('heading', { level: 1 });
        this.txtQuantity = page.getByRole('textbox', { name: 'Qty', exact: true });
        this.btnAddToCart = page.getByRole('button', { name: 'Add to Cart', exact: true });
        this.txtAddedToCartMessage = page.getByText('Success: You have added', { exact: false });
        this.linkShoppingCart = page.getByRole('link', { name: 'shopping cart', exact: true });
    }

    /**
     * Verifies the requested product details are displayed.
     * @param productName - Expected product name
     * @returns Promise<boolean> - true when the matching product heading is visible
     */
    async isProductDetailsDisplayed(productName: string): Promise<boolean> {
        await this.page.getByRole('heading', { name: productName, exact: true, level: 1 })
            .waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Sets the quantity requested for the product.
     * @param quantity - Product quantity
     */
    async setQuantity(quantity: string): Promise<void> {
        await this.txtQuantity.fill(quantity);
    }

    /**
     * Adds the currently displayed product to the shopping cart.
     */
    async addToCart(): Promise<void> {
        await this.btnAddToCart.click();
    }

    /**
     * Verifies the product-added confirmation is displayed.
     * @returns Promise<boolean> - true when the success message is visible
     */
    async isAddedToCartMessageVisible(): Promise<boolean> {
        await this.txtAddedToCartMessage.waitFor({ state: 'visible' });
        return this.txtAddedToCartMessage.isVisible();
    }

    /**
     * Opens the cart using the product-added confirmation link.
     * @returns Promise<ShoppingCartPage> - Shopping cart page object
     */
    async openShoppingCart(): Promise<ShoppingCartPage> {
        await this.linkShoppingCart.click();
        return new ShoppingCartPage(this.page);
    }
}
