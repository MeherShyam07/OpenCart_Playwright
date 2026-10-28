const { spawnSync } = require('node:child_process');

const cliPath = require.resolve('@playwright/test/cli');
const result = spawnSync(
    process.execPath,
    [cliPath, 'test', '--grep', '@api-contract', ...process.argv.slice(2)],
    {
        env: {
            ...process.env,
            API_TEST_MODE: 'contract',
            API_BASE_URL: 'http://127.0.0.1:4010'
        },
        stdio: 'inherit'
    }
);

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
