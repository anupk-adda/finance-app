// Thin wrapper so the CI command `npm test -- --runInBand` (a Jest flag) works with Vitest.
// --runInBand is mapped to Vitest's single-worker mode; all other args pass through.
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const runInBand = args.includes('--runInBand');
const passthrough = args.filter((a) => a !== '--runInBand');
const vitestArgs = ['vitest', 'run', ...(runInBand ? ['--pool=forks', '--poolOptions.forks.singleFork'] : []), ...passthrough];

const result = spawnSync('npx', vitestArgs, { stdio: 'inherit' });
process.exit(result.status ?? 1);
