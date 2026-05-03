const { spawnSync } = require('node:child_process');
const path = require('node:path');

const jestBin = path.resolve(__dirname, '../../../node_modules/jest/bin/jest.js');
const forwardedArgs = process.argv.slice(2).filter((arg, index) => !(arg === '--' && index === 0));

const result = spawnSync(process.execPath, [jestBin, '--config', 'jest.config.cjs', ...forwardedArgs], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
