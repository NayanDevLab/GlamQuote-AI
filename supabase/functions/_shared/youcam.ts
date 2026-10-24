// Typed adapter for the Perfect Corp YouCam API (V2, server-to-server).
//
// Verified against the official reference on 2026-10-12:
//   https://docs.perfectcorp.com/reference/ai_nail_transfer  (task + polling)
//   https://docs.perfectcorp.com/reference/ai_nail_vto       (task + polling)
// and on 2026-10-24:
//   https://docs.perfectcorp.com/reference/ai_hairstyle      (V2.1 templates, task + polling)
//   https://docs.perfectcorp.com/_bundle/reference/file.json (File API)
//
// Only documented endpoints and parameter names are used. This file is plain TypeScript
// with no runtime-specific APIs, so the Edge Function and the local smoke test share it.
// It never logs the API key, upload URLs or result URLs.

const BASE_URL = 'https://yce-api-01.makeupar.com';
const REQUEST_TIMEOUT_MS = 30_000;

/** Why a provider call failed, in terms the caller can act on. */
export type YouCamFailure =
  | 'auth' // 401 — API key missing, wrong or revoked
  | 'quota' // CreditInsufficiency — no units left
  | 'rate_limited' // 429 — 250 requests / 300 s per key and per IP
  | 'rejected' // other 4xx — the request itself was refused
  | 'unavailable' // 5xx, timeout or network failure
  | 'unexpected_response'; // 2xx whose body does not match the documented shape

export class YouCamError extends Error {
  failure: YouCamFailure;
  /** Provider `error_code` when one was returned (e.g. "InvalidParameters"). */
  providerCode: string | null;

  constructor(failure: YouCamFailure, providerCode: string | null, message: string) {
    super(message);
    this.name = 'YouCamError';
    this.failure = failure;
    this.providerCode = providerCode;
  }
}

export type YouCamUpload = {
  fileName: string;
  /** Documented File API values look like "image/jpg" and "image/png". */
  contentType: string;
  bytes: Uint8Array<ArrayBuffer>;
};

export type YouCamTaskState =
  | { status: 'running' }
  | { status: 'success'; resultUrl: string }
  | { status: 'error'; providerCode: string | null };

/** Task families: AI Nail Transfer, AI Nail Virtual Try-On and AI Hairstyle Virtual Try-On. */
export type YouCamTaskFeature = 'ai-nail' | 'nail-vto' | 'hair-transfer';

// Each feature's task path, including its API version.
const TASK_PATH: Record<YouCamTaskFeature, string> = {
  'ai-nail': '/s2s/v2.0/task/ai-nail',
  'nail-vto': '/s2s/v2.0/task/nail-vto',
  'hair-transfer': '/s2s/v2.1/task/hair-transfer',
};

/** A predefined hairstyle. Field names are the documented `Template` schema. */
export type HairstyleTemplate = { id: string; title: string; thumb: string; category: string | null };

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function failureForStatus(httpStatus: number, providerCode: string | null): YouCamFailure {
  if (httpStatus === 401) return 'auth';
  if (httpStatus === 429) return 'rate_limited';
  if (providerCode === 'CreditInsufficiency') return 'quota';
  if (httpStatus >= 500) return 'unavailable';
  return 'rejected';
}

export function createYouCamClient(apiKey: string) {
  async function call(method: 'GET' | 'POST', path: string, body?: JsonObject): Promise<JsonObject> {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new YouCamError('unavailable', null, `YouCam ${method} ${path} did not respond.`);
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON body: handled below as an unexpected response or an HTTP failure.
    }

    if (!response.ok) {
      const providerCode =
        isObject(payload) && typeof payload.error_code === 'string' ? payload.error_code : null;
      throw new YouCamError(
        failureForStatus(response.status, providerCode),
        providerCode,
        `YouCam ${method} ${path} failed with HTTP ${response.status}.`,
      );
    }
    if (!isObject(payload) || !isObject(payload.data)) {
      throw new YouCamError('unexpected_response', null, `YouCam ${method} ${path} returned no data object.`);
    }
    return payload.data;
  }

  /**
   * File API: `POST /s2s/v2.0/file` returns a `file_id` and a pre-signed upload request per
   * file; the bytes are then sent to that URL. Uploaded files are kept by YouCam for 30 days.
   * Returns the `file_id`s in the same order as `uploads`.
   */
  async function uploadFiles(uploads: YouCamUpload[]): Promise<string[]> {
    const data = await call('POST', '/s2s/v2.0/file', {
      files: uploads.map((upload) => ({
        content_type: upload.contentType,
        file_name: upload.fileName,
        file_size: upload.bytes.byteLength,
      })),
    });
    const files = data.files;
    if (!Array.isArray(files) || files.length !== uploads.length) {
      throw new YouCamError('unexpected_response', null, 'YouCam File API returned an unexpected file list.');
    }

    const fileIds: string[] = [];
    for (const [index, upload] of uploads.entries()) {
      const file: unknown = files[index];
      const request = isObject(file) && Array.isArray(file.requests) ? file.requests[0] : null;
      if (!isObject(file) || typeof file.file_id !== 'string' || !isObject(request) || typeof request.url !== 'string') {
        throw new YouCamError('unexpected_response', null, 'YouCam File API returned no upload request.');
      }

      // Send the headers the provider signed, except Content-Length, which fetch sets itself.
      const headers = new Headers();
      if (isObject(request.headers)) {
        for (const [name, value] of Object.entries(request.headers)) {
          if (name.toLowerCase() !== 'content-length') headers.set(name, String(value));
        }
      }

      let uploaded: Response;
      try {
        uploaded = await fetch(request.url, {
          method: typeof request.method === 'string' ? request.method : 'PUT',
          headers,
          body: upload.bytes,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch {
        throw new YouCamError('unavailable', null, 'Uploading to YouCam storage did not complete.');
      }
      if (!uploaded.ok) {
        throw new YouCamError('unavailable', null, `Uploading to YouCam storage failed with HTTP ${uploaded.status}.`);
      }
      fileIds.push(file.file_id);
    }
    return fileIds;
  }

  async function createTask(feature: YouCamTaskFeature, body: JsonObject): Promise<string> {
    const data = await call('POST', TASK_PATH[feature], body);
    if (typeof data.task_id !== 'string' || data.task_id.length === 0) {
      throw new YouCamError('unexpected_response', null, 'YouCam returned no task_id.');
    }
    return data.task_id;
  }

  /** `POST /s2s/v2.0/task/ai-nail` — AI Nail Transfer, consumes 1 unit. Returns the provider `task_id`. */
  function createNailTransferTask(input: { srcFileId: string; refFileId: string }): Promise<string> {
    return createTask('ai-nail', { src_file_id: input.srcFileId, ref_file_id: input.refFileId });
  }

  /**
   * `POST /s2s/v2.0/task/nail-vto` — AI Nail Virtual Try-On, consumes 1 unit. `effects` must
   * already be validated (see nail-vto.ts); `version` is required by the API.
   */
  function createNailVtoTask(input: { srcFileId: string; effectType: string; effects: JsonObject[] }): Promise<string> {
    return createTask('nail-vto', {
      src_file_id: input.srcFileId,
      version: '1.0',
      effect_type: input.effectType,
      effects: input.effects,
    });
  }

  /**
   * `GET <task path>/{task_id}`. `task_status` is running | success | error.
   * On success the download URL (valid for 2 hours, re-issuable by polling again) is in `results.url`.
   */
  async function getTask(feature: YouCamTaskFeature, taskId: string): Promise<YouCamTaskState> {
    const data = await call('GET', `${TASK_PATH[feature]}/${encodeURIComponent(taskId)}`);
    if (data.task_status === 'running') return { status: 'running' };
    if (data.task_status === 'error') {
      return { status: 'error', providerCode: typeof data.error === 'string' ? data.error : null };
    }
    if (data.task_status === 'success') {
      const url = isObject(data.results) ? data.results.url : null;
      if (typeof url !== 'string' || !url.startsWith('https://')) {
        throw new YouCamError('unexpected_response', null, 'YouCam reported success without a result URL.');
      }
      return { status: 'success', resultUrl: url };
    }
    throw new YouCamError('unexpected_response', null, 'YouCam returned an unknown task_status.');
  }

  /**
   * `POST /s2s/v2.1/task/hair-transfer` with a predefined `template_id` — AI Hairstyle Virtual
   * Try-On, consumes 2 units. An unknown template is refused (400 InvalidTemplate) before any charge.
   */
  function createHairstyleTask(input: { srcFileId: string; templateId: string }): Promise<string> {
    return createTask('hair-transfer', { src_file_id: input.srcFileId, template_id: input.templateId });
  }

  /**
   * `GET /s2s/v2.1/task/template/hair-transfer` — one page (at most 20) of predefined hairstyles.
   * Listing creates no task and uses no units. Items without an id or thumbnail are skipped.
   */
  async function listHairstyleTemplates(
    startingToken?: string,
  ): Promise<{ templates: HairstyleTemplate[]; nextToken: string | null }> {
    const query = new URLSearchParams({ page_size: '20' });
    if (startingToken) query.set('starting_token', startingToken);
    const data = await call('GET', `/s2s/v2.1/task/template/hair-transfer?${query}`);
    const items = Array.isArray(data.templates) ? data.templates : [];
    const templates: HairstyleTemplate[] = [];
    for (const item of items) {
      if (!isObject(item) || typeof item.id !== 'string' || typeof item.thumb !== 'string') continue;
      if (!item.thumb.startsWith('https://')) continue;
      templates.push({
        id: item.id,
        title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Hairstyle',
        thumb: item.thumb,
        category: typeof item.category_name === 'string' && item.category_name.trim() ? item.category_name.trim() : null,
      });
    }
    const nextToken = typeof data.next_token === 'string' && data.next_token ? data.next_token : null;
    return { templates, nextToken };
  }

  const getNailTransferTask = (taskId: string) => getTask('ai-nail', taskId);

  return {
    uploadFiles,
    createNailTransferTask,
    createNailVtoTask,
    createHairstyleTask,
    listHairstyleTemplates,
    getTask,
    getNailTransferTask,
  };
}

export type YouCamClient = ReturnType<typeof createYouCamClient>;
