const { spawnSync } = require('node:child_process')

function run(command) {
  const result = spawnSync('cmd', ['/c', command], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }

  if (result.error) {
    throw result.error
  }
}

const mode = process.argv[2]

switch (mode) {
  case 'backend':
    run('pnpm --filter api build')
    run('pnpm --filter api exec jest --runInBand')
    break
  case 'backend-tests':
    run('pnpm --filter api exec jest --runInBand')
    break
  case 'mobile':
    run('pnpm exec tsc -p apps\\mobile\\tsconfig.json --noEmit')
    break
  case 'quick':
    run('pnpm --filter api build')
    run('pnpm exec tsc -p apps\\mobile\\tsconfig.json --noEmit')
    break
  default:
    console.error(`Unknown check mode: ${mode}`)
    process.exit(1)
}
