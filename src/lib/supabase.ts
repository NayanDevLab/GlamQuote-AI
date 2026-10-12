import 'expo-sqlite/localStorage/install';

import {
  createClient,
  FunctionsHttpError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Both values are public by design (the publishable key is protected by Row Level Security).
// Provider secrets — YouCam, Gemini, Cloudinary, the Supabase secret key — never reach this
// file: the app only talks to them through Edge Functions via `invokeEdgeFunction`.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  const created = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Token refresh only needs to run while the app is in the foreground.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      created.auth.startAutoRefresh();
    } else {
      created.auth.stopAutoRefresh();
    }
  });

  client = created;
  return created;
}

let guestSignIn: Promise<Session> | undefined;

/**
 * Returns the stored session, or creates an anonymous (guest) one on first use. Guests need no
 * sign-up; the session is lost if the app's data is cleared or the app is reinstalled.
 * Concurrent callers share one sign-in so a guest is never created twice.
 */
export async function ensureGuestSession(): Promise<Session> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  guestSignIn ??= supabase.auth
    .signInAnonymously()
    .then(({ data: signIn, error }) => {
      if (error || !signIn.session) {
        throw error ?? new Error('Guest sign-in did not return a session.');
      }
      return signIn.session;
    })
    .finally(() => {
      guestSignIn = undefined;
    });
  return guestSignIn;
}

/** An Edge Function answered with an error; `code` is the function's own machine-readable code. */
export class EdgeFunctionError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type InvokeOptions = {
  method?: 'GET' | 'POST';
  body?: FormData | Record<string, unknown>;
};

/**
 * Calls a Supabase Edge Function as the current guest — the only path from the app to YouCam,
 * Gemini or Cloudinary. Throws `EdgeFunctionError` for errors the function reported.
 */
export async function invokeEdgeFunction<TResponse>(
  name: string,
  options: InvokeOptions = {},
): Promise<TResponse> {
  await ensureGuestSession();
  const { data, error } = await getSupabase().functions.invoke<TResponse>(name, {
    method: options.method ?? 'POST',
    body: options.body,
  });

  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    const payload: unknown = await response.json().catch(() => null);
    const reported =
      typeof payload === 'object' && payload !== null && 'error' in payload ? payload.error : null;
    if (typeof reported === 'object' && reported !== null && 'code' in reported) {
      const { code, message, ...details } = reported as Record<string, unknown>;
      throw new EdgeFunctionError(
        String(code),
        typeof message === 'string' ? message : 'The request failed.',
        response.status,
        details,
      );
    }
    throw new EdgeFunctionError('http_error', 'The request failed.', response.status);
  }
  if (error) throw error;
  if (data === null) throw new Error(`Edge Function "${name}" returned no data.`);
  return data;
}
