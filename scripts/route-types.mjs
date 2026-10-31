// Regenerates .expo/types/router.d.ts with Expo Router's own generator, from a full scan of src/app.
//
// Why: on Windows the dev server's file watcher (Expo CLI's typed-routes watch handler) checks
// `relativePath.startsWith('../')`, but path.relative returns `..\` there. Every edited file in
// the project is then added as a "route" (e.g. `/../features/...`), and `settings\index` stops
// collapsing to `/settings`, so `tsc` fails while `expo start` is running. A full generation is
// correct, so `npm run typecheck` runs this first instead of trusting the watcher's last write.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(root, 'src', 'app');
process.env.EXPO_ROUTER_APP_ROOT = appRoot;

const require = createRequire(path.join(root, 'package.json'));
const fromCli = createRequire(require.resolve('@expo/cli/package.json', { paths: [require.resolve('expo/package.json')] }));
const { getTypedRoutesDeclarationFile } = fromCli('@expo/router-server/build/typed-routes/generate');
const { requireContext } = require('expo-router/internal/testing');
const { EXPO_ROUTER_CTX_IGNORE } = require('expo-router/_ctx-shared');

const file = getTypedRoutesDeclarationFile(requireContext(appRoot, true, EXPO_ROUTER_CTX_IGNORE));
if (!file) throw new Error('Expo Router returned no route types.');
const out = path.join(root, '.expo', 'types');
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'router.d.ts'), file);
console.log('Route types regenerated from src/app.');
