const { spawnSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');

const [, , envFile, ...rest] = process.argv;

if (!envFile || rest.length === 0) {
  console.error('Usage: node scripts/with-env.cjs <env-file> [--set KEY=VALUE] -- <command> [...args]');
  process.exit(1);
}

const separatorIndex = rest.indexOf('--');
if (separatorIndex === -1 || separatorIndex === rest.length - 1) {
  console.error('Missing command separator. Expected: -- <command> [...args]');
  process.exit(1);
}

const env = { ...process.env };
const envPath = path.resolve(process.cwd(), envFile);
const parsed = dotenv.config({ path: envPath, quiet: true });

if (parsed.error) {
  console.error(`Unable to load env file: ${envPath}`);
  console.error(parsed.error.message);
  process.exit(1);
}

for (const token of rest.slice(0, separatorIndex)) {
  if (!token.startsWith('--set=')) {
    console.error(`Unknown option: ${token}`);
    process.exit(1);
  }

  const assignment = token.slice('--set='.length);
  const equalsIndex = assignment.indexOf('=');
  if (equalsIndex <= 0) {
    console.error(`Invalid env assignment: ${assignment}`);
    process.exit(1);
  }

  env[assignment.slice(0, equalsIndex)] = assignment.slice(equalsIndex + 1);
}

Object.assign(env, parsed.parsed ?? {});

const command = rest[separatorIndex + 1];
const args = rest.slice(separatorIndex + 2);
const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: true,
  env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
