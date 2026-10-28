export class Helper {
    private static requiredEnvironmentValue(name: string): string {
        const value = process.env[name]?.trim();
        if (!value) {
            throw new Error(`${name} must be configured before running this test.`);
        }

        return value;
    }

    static convertPriceToNumber(price: string): number {
        const cleaned = price.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned);
    }

    static getProductDetails() {
        const productName = this.requiredEnvironmentValue('PRODUCT_NAME');
        const productQuantity = this.requiredEnvironmentValue('PRODUCT_QUANTITY');
        const totalPrice = this.requiredEnvironmentValue('TOTAL_PRICE');

        if (!/^[1-9]\d*$/.test(productQuantity)) {
            throw new Error('PRODUCT_QUANTITY must be a positive integer.');
        }

        return {
            productName,
            productQuantity,
            totalPrice
        };
    }

    static getLoginDetails() {
        const email = process.env.APP_EMAIL?.trim();
        const password = process.env.APP_PASSWORD;

        if (!email || !password) {
            throw new Error('APP_EMAIL and APP_PASSWORD must be configured before running this test.');
        }

        return {
            email,
            password
        };
    }
}