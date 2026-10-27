import { Locator, Page } from '@playwright/test';

export class ShoppingCartPage {
    private readonly page: Page;

    // Locators
    private readonly headingCart: Locator;
    private readonly rows: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingCart = page.getByRole('heading', { name: /Shopping Cart/ });
        this.rows = page.getByRole('row');
    }

    /**
     * Verifies the shopping cart page is displayed.
     * @returns Promise<boolean> - true when the cart heading is visible
     */
    async isShoppingCartPageExists(): Promise<boolean> {
        await this.headingCart.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Verifies that the requested product is present in the cart.
     * @param productName - Product name to find
     * @returns Promise<boolean> - true when the matching cart row is visible
     */
    async isProductInCart(productName: string): Promise<boolean> {
        await this.getProductRow(productName).waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Reads the quantity for the requested cart product.
     * @param productName - Product name to find
     * @returns Promise<string> - Quantity displayed in the cart
     */
    async getProductQuantity(productName: string): Promise<string> {
        return this.getProductRow(productName).getByRole('textbox').inputValue();
    }

    /**
     * Reads the product row text, including price and line total.
     * @param productName - Product name to find
     * @returns Promise<string> - Text displayed in the product row
     */
    async getProductRowText(productName: string): Promise<string> {
        return this.getProductRow(productName).innerText();
    }

    /**
     * Reads the grand-total row from the cart summary.
     * @returns Promise<string> - Text displayed in the total row
     */
    async getGrandTotalRowText(): Promise<string> {
        return this.rows.filter({ has: this.page.getByText('Total:', { exact: true }) }).innerText();
    }

    private getProductRow(productName: string): Locator {
        return this.rows.filter({
            has: this.page.getByRole('link', { name: productName, exact: true })
        });
    }
}
