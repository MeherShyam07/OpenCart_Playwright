import Ajv from 'ajv';
import dotenv from 'dotenv';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { Routes } from '../../api/endpoints/routes';
import cartSchema from '../../api/schemas/cart_api_schema.json';
import productSchema from '../../api/schemas/product_api_schema.json';
import userSchema from '../../api/schemas/user_api_schema.json';
import apiTestData from '../../testdata/fakestore_api_testdata.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

type Product = {
    id: number;
    title: string;
    price: number;
    category: string;
    image: string;
};

type User = {
    id: number;
    username: string;
};

type Cart = {
    id: number;
    userId: number;
    date: string;
    products: Array<{ productId: number; quantity: number }>;
};

function requiredEnvironmentValue(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} must be configured before running FakeStore API tests.`);
    }

    return value;
}

function requiredEnvironmentNumber(name: string): number {
    const value = Number(requiredEnvironmentValue(name));
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer before running FakeStore API tests.`);
    }

    return value;
}

const API_BASE_URL = (process.env.API_BASE_URL || Routes.BASE_URL).replace(/\/+$/, '');
const USERNAME = requiredEnvironmentValue('FAKESTORE_USERNAME');
const PASSWORD = requiredEnvironmentValue('PASSWORD');
const PRODUCT_ID = requiredEnvironmentNumber('PRODUCT_ID');
const USER_ID = requiredEnvironmentNumber('USER_ID');
const CART_ID = requiredEnvironmentNumber('CART_ID');
const LIMIT = requiredEnvironmentNumber('LIMIT');
const START_DATE = requiredEnvironmentValue('START_DATE');
const END_DATE = requiredEnvironmentValue('END_DATE');

function apiUrl(route: string): string {
    return `${API_BASE_URL}${route}`;
}

function routeWithId(route: string, id: number): string {
    return route.replace('{id}', String(id));
}

function responseArray<T>(body: unknown, description: string): T[] {
    expect(Array.isArray(body), `${description} should be an array`).toBe(true);
    if (!Array.isArray(body)) {
        throw new Error(`${description} should be an array`);
    }

    return body as T[];
}

function expectProductFields(product: Product, description: string): void {
    expect(Number.isInteger(product.id), `${description} should have an integer id`).toBe(true);
    expect(typeof product.title, `${description} title should be a string`).toBe('string');
    expect(Number.isFinite(product.price), `${description} price should be a number`).toBe(true);
    expect(typeof product.category, `${description} category should be a string`).toBe('string');
    expect(typeof product.image, `${description} image should be a string`).toBe('string');
}

function expectSortedIds(ids: number[], order: 'asc' | 'desc', description: string): void {
    const sortedIds = [...ids].sort((first, second) => (
        order === 'asc' ? first - second : second - first
    ));
    expect(ids, `${description} IDs should be sorted ${order}`).toEqual(sortedIds);
}

const ajv = new Ajv({ allErrors: true });

function expectSchema(body: unknown, schema: object, description: string): void {
    const validate = ajv.compile(schema);
    const isValid = validate(body);
    expect(
        isValid,
        `${description} schema validation failed: ${ajv.errorsText(validate.errors)}`
    ).toBe(true);
}

test.describe('FakeStore API Tests', () => {
    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

    test('POST - Successful login @master @sanity @api', async ({ request }) => {
        const response = await request.post(apiUrl(Routes.AUTH_LOGIN), {
            data: { username: USERNAME, password: PASSWORD }
        });

        expect(response.status(), 'Successful login should return HTTP 201').toBe(201);

        const body: { token?: unknown } = await response.json();
        expect(typeof body.token, 'Login response token should be a string').toBe('string');
        if (typeof body.token !== 'string') {
            throw new Error('Login response token should be a string.');
        }
        expect(body.token.length, 'Login response token should not be empty').toBeGreaterThan(0);
    });

    test('POST - Invalid login @master @regression @api', async ({ request }) => {
        const response = await request.post(apiUrl(Routes.AUTH_LOGIN), {
            data: {
                username: `${USERNAME}_invalid`,
                password: `${PASSWORD}_invalid`
            }
        });

        expect(response.status(), 'Invalid login should return HTTP 401').toBe(401);

        const message = await response.text();
        expect(message, 'Invalid login should return the documented error message')
            .toBe('username or password is incorrect');
    });

    // ---------------------------------------------------------
    // Products - GET
    // ---------------------------------------------------------

    test('GET - All products @master @sanity @api', async ({ request }) => {
        const response = await request.get(apiUrl(Routes.GET_ALL_PRODUCTS));
        expect(response.status(), 'Get all products should return HTTP 200').toBe(200);

        const products = responseArray<Product>(await response.json(), 'Products response');
        expect(products.length, 'At least one product should be returned').toBeGreaterThan(0);
        products.forEach((product, index) => expectProductFields(product, `Product ${index}`));
    });

    test('GET - Product by ID @master @sanity @api', async ({ request }) => {
        const response = await request.get(apiUrl(routeWithId(Routes.GET_PRODUCT_BY_ID, PRODUCT_ID)));
        expect(response.status(), 'Get product by ID should return HTTP 200').toBe(200);

        const product = await response.json() as Product;
        expect(product.id, 'Returned product ID should match the requested ID').toBe(PRODUCT_ID);
        expectProductFields(product, 'Product');
    });

    test('GET - Products with limit @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(apiUrl(route));
        expect(response.status(), 'Limited products request should return HTTP 200').toBe(200);

        const products = responseArray<Product>(await response.json(), 'Limited products response');
        expect(products.length, 'Product count should match the configured limit').toBe(LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Products sorted ${order} @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', order);
            const response = await request.get(apiUrl(route));
            expect(response.status(), `Sorted products (${order}) should return HTTP 200`).toBe(200);

            const products = responseArray<Product>(await response.json(), 'Sorted products response');
            const ids = products.map(product => product.id);
            expectSortedIds(ids, order, 'Product');
        });
    }

    test('GET - All product categories @master @sanity @api', async ({ request }) => {
        const response = await request.get(apiUrl(Routes.GET_ALL_CATEGORIES));
        expect(response.status(), 'Get all product categories should return HTTP 200').toBe(200);

        const categories = responseArray<unknown>(await response.json(), 'Categories response');
        expect(categories.length, 'At least one product category should be returned').toBeGreaterThan(0);
        categories.forEach((category, index) => {
            expect(typeof category, `Category ${index} should be a string`).toBe('string');
        });
    });

    test('GET - Products by category @master @sanity @api', async ({ request }) => {
        const category = 'electronics';
        const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace('{category}', category);
        const response = await request.get(apiUrl(route));
        expect(response.status(), 'Get products by category should return HTTP 200').toBe(200);

        const products = responseArray<Product>(await response.json(), 'Category products response');
        products.forEach((product, index) => {
            expect(product.category, `Product ${index} should belong to ${category}`).toBe(category);
        });
    });

    // ---------------------------------------------------------
    // Products - POST / PUT / DELETE
    // ---------------------------------------------------------

    test('POST - Create product @master @regression @api', async ({ request }) => {
        const payload = apiTestData.product.create;
        const response = await request.post(apiUrl(Routes.CREATE_PRODUCT), { data: payload });
        expect(response.status(), 'Create product should return HTTP 201').toBe(201);

        const created = await response.json() as Product;
        expect(Number.isInteger(created.id), 'Created product should include an integer ID').toBe(true);
        expect(created.id, 'Created product ID should be positive').toBeGreaterThan(0);
        expect(created).toMatchObject(payload);
    });

    test('PUT - Update product @master @regression @api', async ({ request }) => {
        const route = routeWithId(Routes.UPDATE_PRODUCT, PRODUCT_ID);
        const payload = apiTestData.product.update;
        const response = await request.put(apiUrl(route), { data: payload });
        expect(response.status(), 'Update product should return HTTP 200').toBe(200);

        const updated = await response.json() as Product;
        expect(updated.id, 'Updated product ID should match the requested ID').toBe(PRODUCT_ID);
        expect(updated).toMatchObject(payload);
    });

    test('DELETE - Product @master @regression @api', async ({ request }) => {
        const response = await request.delete(apiUrl(routeWithId(Routes.DELETE_PRODUCT, PRODUCT_ID)));
        expect(response.status(), 'Delete product should return HTTP 200').toBe(200);
        const responseText = await response.text();
        if (responseText.trim()) {
            const deleted = JSON.parse(responseText) as { id?: number };
            expect(deleted.id, 'Deleted product response should identify the requested product')
                .toBe(PRODUCT_ID);
        }
    });

    // ---------------------------------------------------------
    // Users - GET
    // ---------------------------------------------------------

    test('GET - All users @master @sanity @api', async ({ request }) => {
        const response = await request.get(apiUrl(Routes.GET_ALL_USERS));
        expect(response.status(), 'Get all users should return HTTP 200').toBe(200);

        const users = responseArray<User>(await response.json(), 'Users response');
        expect(users.length, 'At least one user should be returned').toBeGreaterThan(0);
    });

    test('GET - User by ID @master @sanity @api', async ({ request }) => {
        const response = await request.get(apiUrl(routeWithId(Routes.GET_USER_BY_ID, USER_ID)));
        expect(response.status(), 'Get user by ID should return HTTP 200').toBe(200);

        const user = await response.json() as User;
        expect(user.id, 'Returned user ID should match the requested ID').toBe(USER_ID);
    });

    test('GET - Users with limit @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_USERS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(apiUrl(route));
        expect(response.status(), 'Limited users request should return HTTP 200').toBe(200);

        const users = responseArray<User>(await response.json(), 'Limited users response');
        expect(users.length, 'User count should match the configured limit').toBe(LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Users sorted ${order} @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_USERS_SORTED.replace('{order}', order);
            const response = await request.get(apiUrl(route));
            expect(response.status(), `Sorted users (${order}) should return HTTP 200`).toBe(200);

            const users = responseArray<User>(await response.json(), 'Sorted users response');
            expectSortedIds(users.map(user => user.id), order, 'User');
        });
    }

    // ---------------------------------------------------------
    // Users - POST / PUT / DELETE
    // ---------------------------------------------------------

    test('POST - Create user @master @regression @api', async ({ request }) => {
        const payload = apiTestData.user.create;
        const response = await request.post(apiUrl(Routes.CREATE_USER), { data: payload });
        expect(response.status(), 'Create user should return HTTP 201').toBe(201);

        const created = await response.json() as { id: number };
        expect(Number.isInteger(created.id), 'Created user should include an integer ID').toBe(true);
        expect(created.id, 'Created user ID should be positive').toBeGreaterThan(0);
    });

    test('PUT - Update user @master @regression @api', async ({ request }) => {
        const payload = apiTestData.user.update;
        const response = await request.put(
            apiUrl(routeWithId(Routes.UPDATE_USER, USER_ID)),
            { data: payload }
        );
        expect(response.status(), 'Update user should return HTTP 200').toBe(200);

        const updated: unknown = await response.json();
        expect(updated).toMatchObject(payload);
    });

    test('DELETE - User @master @regression @api', async ({ request }) => {
        const response = await request.delete(apiUrl(routeWithId(Routes.DELETE_USER, USER_ID)));
        expect(response.status(), 'Delete user should return HTTP 200').toBe(200);
        const responseText = await response.text();
        if (responseText.trim()) {
            const deleted = JSON.parse(responseText) as { id?: number };
            expect(deleted.id, 'Deleted user response should identify the requested user').toBe(USER_ID);
        }
    });

    // ---------------------------------------------------------
    // Carts - GET
    // ---------------------------------------------------------

    test('GET - All carts @master @sanity @api', async ({ request }) => {
        const response = await request.get(apiUrl(Routes.GET_ALL_CARTS));
        expect(response.status(), 'Get all carts should return HTTP 200').toBe(200);

        const carts = responseArray<Cart>(await response.json(), 'Carts response');
        expect(carts.length, 'At least one cart should be returned').toBeGreaterThan(0);
    });

    test('GET - Cart by ID @master @sanity @api', async ({ request }) => {
        const response = await request.get(apiUrl(routeWithId(Routes.GET_CART_BY_ID, CART_ID)));
        expect(response.status(), 'Get cart by ID should return HTTP 200').toBe(200);

        const cart = await response.json() as Cart;
        expect(cart.id, 'Returned cart ID should match the requested ID').toBe(CART_ID);
    });

    test('GET - Carts by date range @master @regression @api', async ({ request }) => {
        const route = Routes.GET_CARTS_BY_DATE_RANGE
            .replace('{startdate}', encodeURIComponent(START_DATE))
            .replace('{enddate}', encodeURIComponent(END_DATE));
        const response = await request.get(apiUrl(route));
        expect(response.status(), 'Carts by date range should return HTTP 200').toBe(200);

        const carts = responseArray<Cart>(await response.json(), 'Date-filtered carts response');
        const startTime = Date.parse(START_DATE);
        const endTime = Date.parse(END_DATE);
        expect(Number.isFinite(startTime), 'Configured start date should be valid').toBe(true);
        expect(Number.isFinite(endTime), 'Configured end date should be valid').toBe(true);
        expect(startTime, 'Start date should not be after end date').toBeLessThanOrEqual(endTime);

        carts.forEach((cart, index) => {
            const cartTime = Date.parse(cart.date);
            expect(Number.isFinite(cartTime), `Cart ${index} should contain a valid date`).toBe(true);
            expect(cartTime, `Cart ${index} should not precede the start date`).toBeGreaterThanOrEqual(startTime);
            expect(cartTime, `Cart ${index} should not exceed the end date`).toBeLessThanOrEqual(endTime);
        });
    });

    test('GET - Carts for user @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_USER_CART.replace('{userId}', String(USER_ID));
        const response = await request.get(apiUrl(route));
        expect(response.status(), 'Get user carts should return HTTP 200').toBe(200);

        const carts = responseArray<Cart>(await response.json(), 'User carts response');
        expect(carts.length, 'At least one cart should be returned for the configured user').toBeGreaterThan(0);
        carts.forEach((cart, index) => {
            expect(cart.userId, `Cart ${index} should belong to the requested user`).toBe(USER_ID);
        });
    });

    test('GET - Carts with limit @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_CARTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(apiUrl(route));
        expect(response.status(), 'Limited carts request should return HTTP 200').toBe(200);

        const carts = responseArray<Cart>(await response.json(), 'Limited carts response');
        expect(carts.length, 'Cart count should match the configured limit').toBe(LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Carts sorted ${order} @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_CARTS_SORTED.replace('{order}', order);
            const response = await request.get(apiUrl(route));
            expect(response.status(), `Sorted carts (${order}) should return HTTP 200`).toBe(200);

            const carts = responseArray<Cart>(await response.json(), 'Sorted carts response');
            expectSortedIds(carts.map(cart => cart.id), order, 'Cart');
        });
    }

    // ---------------------------------------------------------
    // Carts - POST / PUT / DELETE
    // ---------------------------------------------------------

    function cartPayload(userId: number, productId: number, date: string, quantity: number) {
        return {
            userId,
            date,
            products: [{ productId, quantity }]
        };
    }

    test('POST - Create cart @master @regression @api', async ({ request }) => {
        const payload = cartPayload(
            USER_ID,
            PRODUCT_ID,
            apiTestData.cart.create.date,
            apiTestData.cart.create.quantity
        );
        const response = await request.post(apiUrl(Routes.CREATE_CART), { data: payload });
        expect(response.status(), 'Create cart should return HTTP 201').toBe(201);

        const created = await response.json() as Cart;
        expect(Number.isInteger(created.id), 'Created cart should include an integer ID').toBe(true);
        expect(created.id, 'Created cart ID should be positive').toBeGreaterThan(0);
        expect(created).toMatchObject(payload);
    });

    test('PUT - Update cart @master @regression @api', async ({ request }) => {
        const payload = cartPayload(
            USER_ID,
            PRODUCT_ID,
            apiTestData.cart.update.date,
            apiTestData.cart.update.quantity
        );
        const response = await request.put(
            apiUrl(routeWithId(Routes.UPDATE_CART, CART_ID)),
            { data: payload }
        );
        expect(response.status(), 'Update cart should return HTTP 200').toBe(200);

        const updated = await response.json() as Cart;
        expect(updated.id, 'Updated cart ID should match the requested ID').toBe(CART_ID);
        expect(updated).toMatchObject(payload);
        expect(updated.products[0]?.quantity, 'Updated cart should reflect the requested quantity')
            .toBe(apiTestData.cart.update.quantity);
    });

    test('DELETE - Cart @master @regression @api', async ({ request }) => {
        const response = await request.delete(apiUrl(routeWithId(Routes.DELETE_CART, CART_ID)));
        expect(response.status(), 'Delete cart should return HTTP 200').toBe(200);
        const responseText = await response.text();
        if (responseText.trim()) {
            const deleted = JSON.parse(responseText) as { id?: number };
            expect(deleted.id, 'Deleted cart response should identify the requested cart').toBe(CART_ID);
        }
    });

    // ---------------------------------------------------------
    // JSON Schema Validation
    // ---------------------------------------------------------

    test('GET - Product response schema @master @regression @api', async ({ request }) => {
        const response = await request.get(apiUrl(routeWithId(Routes.GET_PRODUCT_BY_ID, PRODUCT_ID)));
        expect(response.status(), 'Product schema request should return HTTP 200').toBe(200);

        const body: unknown = await response.json();
        expectSchema(body, productSchema, 'Product response');
    });

    test('GET - User response schema @master @regression @api', async ({ request }) => {
        const response = await request.get(apiUrl(routeWithId(Routes.GET_USER_BY_ID, USER_ID)));
        expect(response.status(), 'User schema request should return HTTP 200').toBe(200);

        const body: unknown = await response.json();
        expectSchema(body, userSchema, 'User response');
    });

    test('GET - Cart response schema @master @regression @api', async ({ request }) => {
        const response = await request.get(apiUrl(routeWithId(Routes.GET_CART_BY_ID, CART_ID)));
        expect(response.status(), 'Cart schema request should return HTTP 200').toBe(200);

        const body: unknown = await response.json();
        expectSchema(body, cartSchema, 'Cart response');
    });

    // ---------------------------------------------------------
    // End-to-End CRUD Workflows
    // ---------------------------------------------------------

    test.describe.serial('CRUD workflows', () => {
        test('Product create, update, and delete workflow @master @regression @api @end-to-end', async ({ request }) => {
            const createPayload = apiTestData.product.create;
            const createResponse = await request.post(apiUrl(Routes.CREATE_PRODUCT), { data: createPayload });
            expect(createResponse.status(), 'Workflow product creation should return HTTP 201').toBe(201);

            const created = await createResponse.json() as Product;
            expect(Number.isInteger(created.id), 'Workflow product should include an integer ID').toBe(true);
            const productId = created.id;

            const updatePayload = apiTestData.product.update;
            const updateResponse = await request.put(
                apiUrl(routeWithId(Routes.UPDATE_PRODUCT, productId)),
                { data: updatePayload }
            );
            expect(updateResponse.status(), 'Workflow product update should return HTTP 200').toBe(200);

            const updated = await updateResponse.json() as Product;
            expect(updated.id, 'Workflow update should use the created product ID').toBe(productId);
            expect(updated).toMatchObject(updatePayload);

            const deleteResponse = await request.delete(
                apiUrl(routeWithId(Routes.DELETE_PRODUCT, productId))
            );
            expect(deleteResponse.status(), 'Workflow product deletion should return HTTP 200').toBe(200);
        });

        test('User create, update, and delete workflow @master @regression @api @end-to-end', async ({ request }) => {
            const createPayload = apiTestData.user.create;
            const createResponse = await request.post(apiUrl(Routes.CREATE_USER), { data: createPayload });
            expect(createResponse.status(), 'Workflow user creation should return HTTP 201').toBe(201);

            const created = await createResponse.json() as User;
            expect(Number.isInteger(created.id), 'Workflow user should include an integer ID').toBe(true);
            const userId = created.id;

            const updatePayload = apiTestData.user.update;
            const updateResponse = await request.put(
                apiUrl(routeWithId(Routes.UPDATE_USER, userId)),
                { data: updatePayload }
            );
            expect(updateResponse.status(), 'Workflow user update should return HTTP 200').toBe(200);

            const updated: unknown = await updateResponse.json();
            expect(updated).toMatchObject(updatePayload);

            const deleteResponse = await request.delete(apiUrl(routeWithId(Routes.DELETE_USER, userId)));
            expect(deleteResponse.status(), 'Workflow user deletion should return HTTP 200').toBe(200);
        });

        test('Cart create, update, and delete workflow @master @regression @api @end-to-end', async ({ request }) => {
            const createPayload = cartPayload(
                USER_ID,
                PRODUCT_ID,
                apiTestData.cart.create.date,
                apiTestData.cart.create.quantity
            );
            const createResponse = await request.post(apiUrl(Routes.CREATE_CART), { data: createPayload });
            expect(createResponse.status(), 'Workflow cart creation should return HTTP 201').toBe(201);

            const created = await createResponse.json() as Cart;
            expect(Number.isInteger(created.id), 'Workflow cart should include an integer ID').toBe(true);
            const cartId = created.id;
            expect(created).toMatchObject(createPayload);

            const updatePayload = cartPayload(
                USER_ID,
                PRODUCT_ID,
                apiTestData.cart.update.date,
                apiTestData.cart.update.quantity
            );
            const updateResponse = await request.put(
                apiUrl(routeWithId(Routes.UPDATE_CART, cartId)),
                { data: updatePayload }
            );
            expect(updateResponse.status(), 'Workflow cart update should return HTTP 200').toBe(200);

            const updated = await updateResponse.json() as Cart;
            expect(updated.id, 'Workflow update should use the created cart ID').toBe(cartId);
            expect(updated).toMatchObject(updatePayload);
            expect(updated.products[0]?.quantity, 'Workflow should reflect the updated product quantity')
                .toBe(apiTestData.cart.update.quantity);

            const deleteResponse = await request.delete(apiUrl(routeWithId(Routes.DELETE_CART, cartId)));
            expect(deleteResponse.status(), 'Workflow cart deletion should return HTTP 200').toBe(200);
        });
    });
});
