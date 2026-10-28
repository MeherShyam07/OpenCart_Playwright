const http = require('node:http');

const collections = new Map([
    ['products', new Map()],
    ['users', new Map()],
    ['carts', new Map()]
]);
let nextId = 1000;

function respond(response, statusCode, body) {
    response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.setEncoding('utf8');
        request.on('data', chunk => {
            body += chunk;
        });
        request.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        request.on('error', reject);
    });
}

const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;

    if (request.method === 'GET' && pathname === '/health') {
        respond(response, 200, { status: 'ok' });
        return;
    }

    const collectionMatch = pathname.match(/^\/(products|users|carts)$/);
    const itemMatch = pathname.match(/^\/(products|users|carts)\/(\d+)$/);

    if (request.method === 'POST' && collectionMatch) {
        let payload;
        try {
            payload = await readJson(request);
        } catch {
            respond(response, 400, { message: 'Request body must be valid JSON.' });
            return;
        }

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            respond(response, 400, { message: 'Request body must be a JSON object.' });
            return;
        }

        const collection = collections.get(collectionMatch[1]);
        const id = nextId++;
        const created = { ...payload, id };
        collection.set(id, created);
        respond(response, 201, created);
        return;
    }

    if (itemMatch) {
        const collection = collections.get(itemMatch[1]);
        const id = Number(itemMatch[2]);
        const existing = collection.get(id);

        if (request.method === 'PUT') {
            if (!existing) {
                respond(response, 404, { message: 'Record not found.' });
                return;
            }

            let payload;
            try {
                payload = await readJson(request);
            } catch {
                respond(response, 400, { message: 'Request body must be valid JSON.' });
                return;
            }

            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
                respond(response, 400, { message: 'Request body must be a JSON object.' });
                return;
            }

            const updated = { ...existing, ...payload, id };
            collection.set(id, updated);
            respond(response, 200, updated);
            return;
        }

        if (request.method === 'DELETE') {
            if (!collection.delete(id)) {
                respond(response, 404, { message: 'Record not found.' });
                return;
            }

            respond(response, 200, { id });
            return;
        }
    }

    respond(response, 404, { message: 'Route not found.' });
});

server.listen(4010, '127.0.0.1');
