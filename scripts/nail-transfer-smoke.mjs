// Smoke test for the real YouCam AI Nail Transfer integration. Run from the project root.
//
//   node scripts/nail-transfer-smoke.mjs check
//       Verifies the API key against the File API. Creates no task and uses no units.
//
//   node scripts/nail-transfer-smoke.mjs run-function <hand> <reference> --confirm-1-unit
//       Full path: guest sign-in -> deployed Edge Function -> YouCam -> result download.
//
//   node scripts/nail-transfer-smoke.mjs run-direct <hand> <reference> --confirm-1-unit
//       Calls YouCam directly with the same adapter the Edge Function uses (no Supabase needed).
//
// Each run-* command creates exactly ONE task (1 YouCam unit) and refuses to start without
// --confirm-1-unit. Values are read from .env; this script never prints the
// API key, upload URLs or result URLs. The result image is written to .smoke/ (git-ignored).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';

import { describeImageProblem, inspectImage } from '../supabase/functions/_shared/image.ts';
import { createYouCamClient, YouCamError } from '../supabase/functions/_shared/youcam.ts';

if (existsSync('.env')) process.loadEnvFile('.env');

const POLL_INTERVAL_MS = 10_000; // YouCam's documented suggestion
const POLL_TIMEOUT_MS = 5 * 60_000;
const OUTPUT_DIR = '.smoke';

const [command, handPath, referencePath] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const confirmed = process.argv.includes('--confirm-1-unit');

class Stop extends Error {}

/** Ends the run with a message. Thrown (not process.exit) so Node shuts down cleanly on Windows. */
function stop(message) {
  throw new Stop(message);
}

function requireEnv(name, where) {
  const value = process.env[name];
  if (!value) stop(`${name} is not set. Add it to ${where}.`);
  return value;
}

function loadImage(label, path) {
  if (!path) stop(`Missing the ${label} image path.`);
  if (!existsSync(path)) stop(`${label} image not found: ${path}`);
  const bytes = new Uint8Array(readFileSync(path));
  const problem = describeImageProblem(bytes);
  if (problem) stop(`${label} image (${basename(path)}) is not usable: ${problem}`);
  const info = inspectImage(bytes);
  console.log(`  ${label}: ${basename(path)} — ${info.format.toUpperCase()} ${info.width}×${info.height}, ${(bytes.length / 1024).toFixed(0)} KB`);
  return { bytes, info };
}

function requireConfirmation() {
  if (confirmed) return;
  stop('This creates one real YouCam task and consumes 1 unit. Re-run with --confirm-1-unit to proceed.');
}

async function saveResult(resultUrl) {
  const response = await fetch(resultUrl);
  if (!response.ok) stop(`Result download failed with HTTP ${response.status}.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const info = inspectImage(bytes);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = `${OUTPUT_DIR}/nail-transfer-result.${info?.format === 'png' ? 'png' : 'jpg'}`;
  writeFileSync(file, bytes);
  console.log(`  result host: ${new URL(resultUrl).host}`);
  console.log(`  content-type: ${response.headers.get('content-type')}`);
  console.log(`  image: ${info ? `${info.format.toUpperCase()} ${info.width}×${info.height}` : 'unrecognised format'}, ${(bytes.length / 1024).toFixed(0)} KB`);
  console.log(`  saved to: ${file}`);
}

async function poll(readState) {
  const startedAt = Date.now();
  for (;;) {
    const state = await readState();
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(0);
    console.log(`  [${seconds}s] status: ${state.status}`);
    if (state.status !== 'running') return state;
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) stop('Timed out waiting for the task. It may still finish; no second task was created.');
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function check() {
  const apiKey = requireEnv('YOUCAM_API_KEY', '.env');
  console.log('Checking the YouCam API key against the File API (no task, no units)…');
  // Requests an upload slot only; nothing is uploaded and no task is created.
  const response = await fetch('https://yce-api-01.makeupar.com/s2s/v2.0/file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [{ content_type: 'image/jpg', file_name: 'auth-check.jpg', file_size: 1024 }] }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    stop(`File API answered HTTP ${response.status} (${payload?.error_code ?? 'no error_code'}). The key was not accepted.`);
  }
  const file = payload?.data?.files?.[0];
  const request = file?.requests?.[0];
  console.log(`  ✔ HTTP ${response.status} — the API key is accepted.`);
  console.log(`  file_id returned: ${typeof file?.file_id === 'string' ? 'yes' : 'NO (unexpected)'}`);
  console.log(`  upload request: ${request?.method ?? '?'} to host ${request?.url ? new URL(request.url).host : '?'}`);
  console.log(`  signed upload headers: ${request?.headers ? Object.keys(request.headers).join(', ') : '(none)'}`);
  console.log('\nThis proves authentication only. Unit balance is shown in the YouCam console;');
  console.log('Nail Transfer itself is confirmed by the first real task.');
}

async function runDirect() {
  const apiKey = requireEnv('YOUCAM_API_KEY', '.env');
  console.log('Inputs:');
  const hand = loadImage('hand', handPath);
  const reference = loadImage('reference', referencePath);
  requireConfirmation();

  const youcam = createYouCamClient(apiKey);
  const upload = (name, image) => ({
    fileName: `${name}.${image.info.format === 'png' ? 'png' : 'jpg'}`,
    contentType: image.info.format === 'png' ? 'image/png' : 'image/jpg',
    bytes: image.bytes,
  });

  console.log('\nUploading both images through the YouCam File API…');
  const [srcFileId, refFileId] = await youcam.uploadFiles([upload('hand', hand), upload('reference', reference)]);
  console.log('  ✔ uploaded');

  console.log('Creating ONE Nail Transfer task (1 unit)…');
  const taskId = await youcam.createNailTransferTask({ srcFileId, refFileId });
  console.log('  ✔ task accepted');

  const state = await poll(() => youcam.getNailTransferTask(taskId));
  if (state.status === 'error') stop(`YouCam reported an error for the task: ${state.providerCode ?? 'no code'}.`);
  console.log('\nResult:');
  await saveResult(state.resultUrl);
  console.log('\n✔ Real Nail Transfer request, status polling and result download all worked.');
}

async function runFunction() {
  const url = requireEnv('EXPO_PUBLIC_SUPABASE_URL', '.env');
  const publishableKey = requireEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '.env');
  console.log('Inputs:');
  const hand = loadImage('hand', handPath);
  const reference = loadImage('reference', referencePath);
  requireConfirmation();

  const { createClient, FunctionsHttpError } = await import('@supabase/supabase-js');
  const supabase = createClient(url, publishableKey, { auth: { persistSession: false } });

  console.log('\nSigning in as a new guest (anonymous)…');
  const { error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError) stop(`Guest sign-in failed: ${signInError.message}. Enable Anonymous Sign-Ins in the Supabase dashboard.`);
  console.log('  ✔ guest session created');

  const invoke = async (name, options) => {
    const { data, error } = await supabase.functions.invoke(name, options);
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      stop(`Edge Function answered HTTP ${error.context.status}: ${body?.error?.code ?? 'unknown'} — ${body?.error?.message ?? ''}`);
    }
    if (error) stop(`Edge Function call failed: ${error.message}`);
    return data;
  };

  const idempotencyKey = randomUUID();
  const buildForm = () => {
    const form = new FormData();
    form.append('idempotency_key', idempotencyKey);
    form.append('hand', new Blob([hand.bytes]), `hand.${hand.info.format}`);
    form.append('reference', new Blob([reference.bytes]), `reference.${reference.info.format}`);
    return form;
  };

  console.log('Creating ONE Nail Transfer task through the Edge Function (1 unit)…');
  const created = await invoke('nail-transfer', { method: 'POST', body: buildForm() });
  console.log(`  ✔ task ${created.taskId} — status: ${created.status}`);

  console.log('Re-sending the same idempotency key (must reuse the task, not create another)…');
  const repeated = await invoke('nail-transfer', { method: 'POST', body: buildForm() });
  if (repeated.taskId !== created.taskId || repeated.reused !== true) {
    stop('Duplicate protection FAILED: the repeat request did not return the original task.');
  }
  console.log('  ✔ same task returned, no second task created');

  const state = await poll(() => invoke(`nail-transfer?task_id=${created.taskId}`, { method: 'GET' }));
  if (state.status === 'error') stop(`The task ended in an error: ${state.errorCode}.`);
  console.log('\nResult:');
  await saveResult(state.resultUrl);
  console.log('\n✔ Guest auth, Edge Function, YouCam task, polling and result download all worked.');
}

const commands = { check, 'run-direct': runDirect, 'run-function': runFunction };

try {
  if (!commands[command]) {
    stop('Usage: node scripts/nail-transfer-smoke.mjs <check | run-function | run-direct> [hand] [reference] [--confirm-1-unit]');
  }
  await commands[command]();
} catch (error) {
  process.exitCode = 1;
  if (error instanceof Stop) {
    console.error(`\n✖ ${error.message}`);
  } else if (error instanceof YouCamError) {
    console.error(`\n✖ YouCam call failed: ${error.failure}${error.providerCode ? ` (${error.providerCode})` : ''} — ${error.message}`);
  } else {
    throw error;
  }
}
