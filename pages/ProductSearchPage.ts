import { Locator, Page } from '@playwright/test';
import { ProductPage } from './ProductPage';

export class ProductSearchPage {
    private readonly page: Page;

    // Locators
    private readonly headingSearchResults: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingSearchResults = page.getByRole('heading', { level: 1 });
    }

    /**
     * Verifies the search results heading and requested product are displayed.
     * @param productName - Expected product name
     * @returns Promise<boolean> - true when the result page contains the product
     */
    async isProductDisplayed(productName: string): Promise<boolean> {
        const heading = this.page.getByRole('heading', { name: `Search - ${productName}`, exact: true });
        const product = this.page.getByRole('heading', { name: productName, exact: true });
        await this.headingSearchResults.waitFor({ state: 'visible' });
        await heading.waitFor({ state: 'visible' });
        await product.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Opens a product from the search results.
     * @param productName - Exact product name to open
     * @returns Promise<ProductPage> - Product details page object
     */
    async openProduct(productName: string): Promise<ProductPage> {
        await this.page.getByRole('heading', { name: productName, exact: true })
            .getByRole('link', { name: productName, exact: true })
            .click();
        return new ProductPage(this.page);
    }
}
