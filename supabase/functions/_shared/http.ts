// Small helpers shared by the Edge Functions.

import { createSupabaseContext } from '@supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: { code, message, ...extra } }, status);
}

export type Caller = {
  userId: string;
  /** Bypasses RLS: every query made with it must filter by `userId`. */
  db: SupabaseClient;
};

/** Resolves the signed-in (guest) caller, or returns the 401 response to send back. */
export async function authenticate(req: Request): Promise<Caller | Response> {
  const { data: ctx, error } = await createSupabaseContext(req, { auth: 'user' });
  if (error) return fail(error.status, 'unauthorized', 'Sign in to continue.');
  const userId = ctx.userClaims?.id;
  if (!userId) return fail(401, 'unauthorized', 'Sign in to continue.');
  return { userId, db: ctx.supabaseAdmin };
}

export async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
