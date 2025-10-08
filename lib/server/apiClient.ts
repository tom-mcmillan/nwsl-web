import 'server-only';
import type { HealthResponse } from '@/lib/api';

const API_BASE_URL = process.env.NWSL_API_BASE_URL ?? 'http://127.0.0.1:8080';
const API_KEY = process.env.NWSL_API_KEY;

if (!API_KEY) {
  throw new Error('NWSL_API_KEY is required on the server to reach the NWSL API.');
}

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  headers.set('X-API-Key', API_KEY as string);
  return headers;
}

async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
  errorHint?: string
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: buildHeaders(init.headers),
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorHint ? `${errorHint}: ${message}` : message);
  }

  return response.json() as Promise<T>;
}

export async function fetchPanel(slug: string, limit?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) {
    params.set('limit', String(limit));
  }
  const queryString = params.toString();
  const path = `/panel/${encodeURIComponent(slug)}${queryString ? `?${queryString}` : ''}`;
  return backendFetch<{
    panel: {
      slug: string;
      title: string;
      description?: string | null;
      max_rows: number;
      tags: string[];
    };
    results: Record<string, unknown>[];
    row_count: number;
    columns: string[];
    execution_time_ms: number;
  }>(path, undefined, `Failed to load panel ${slug}`);
}

export async function executeSql(sql: string) {
  return backendFetch<{
    results: Record<string, unknown>[];
    row_count: number;
    columns: string[];
    execution_time_ms: number;
  }>(
    '/sql',
    {
      method: 'POST',
      body: JSON.stringify({ sql }),
    },
    'SQL execution failed'
  );
}

export async function executeQuery(query: string) {
  return backendFetch<{
    results: Array<Record<string, unknown>>;
    row_count: number;
  }>(
    '/query',
    {
      method: 'POST',
      body: JSON.stringify({ query }),
    },
    'Query execution failed'
  );
}

export async function fetchHealth() {
  return backendFetch<HealthResponse>(
    '/health',
    { method: 'GET' },
    'Health endpoint failed'
  );
}
