import 'server-only';
import type { HealthResponse } from '@/lib/api';

export interface AdminPanelTab {
  id: string;
  label: string;
  description?: string | null;
  sql: string;
  position?: number;
}

export interface AdminPanelDefinition {
  slug: string;
  title: string;
  description?: string | null;
  max_rows: number;
  tags?: string[];
  tabs: AdminPanelTab[];
}

const API_BASE_URL = process.env.NWSL_API_BASE_URL ?? 'http://127.0.0.1:8080';
const API_KEY = process.env.NWSL_API_KEY;
const PANEL_ADMIN_TOKEN = process.env.NWSL_PANEL_ADMIN_TOKEN;

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

function withAdminHeaders(headers?: HeadersInit): HeadersInit {
  if (!PANEL_ADMIN_TOKEN) {
    throw new Error('NWSL_PANEL_ADMIN_TOKEN is required to manage panels.');
  }
  const merged = new Headers(headers);
  merged.set('Authorization', `Bearer ${PANEL_ADMIN_TOKEN}`);
  return merged;
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

export async function fetchAdminPanels() {
  return backendFetch<{ panels: AdminPanelDefinition[] }>(
    '/admin/panels',
    { headers: withAdminHeaders() },
    'Failed to load panel catalog'
  );
}

export async function fetchAdminPanel(slug: string) {
  return backendFetch<{ panel: AdminPanelDefinition }>(
    `/admin/panels/${encodeURIComponent(slug)}`,
    { headers: withAdminHeaders() },
    `Failed to load panel ${slug}`
  );
}

export async function saveAdminPanel(panel: AdminPanelDefinition) {
  const method = panel?.slug ? 'PUT' : 'POST';
  const path = panel?.slug
    ? `/admin/panels/${encodeURIComponent(panel.slug)}`
    : '/admin/panels';

  return backendFetch<{ panel: AdminPanelDefinition }>(
    path,
    {
      method,
      headers: withAdminHeaders(),
      body: JSON.stringify(panel),
    },
    `Failed to save panel ${panel.slug}`
  );
}

export async function createAdminPanel(panel: AdminPanelDefinition) {
  return backendFetch<{ panel: AdminPanelDefinition }>(
    '/admin/panels',
    {
      method: 'POST',
      headers: withAdminHeaders(),
      body: JSON.stringify(panel),
    },
    `Failed to create panel ${panel.slug}`
  );
}

export async function deleteAdminPanel(slug: string) {
  await backendFetch<{ message: string }>(
    `/admin/panels/${encodeURIComponent(slug)}`,
    {
      method: 'DELETE',
      headers: withAdminHeaders(),
    },
    `Failed to delete panel ${slug}`
  );
}
