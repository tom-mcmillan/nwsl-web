import 'server-only';

const VIZ_BASE_URL =
  process.env.NWSL_VIZ_BASE_URL ?? 'https://nwsl-viz-havwlplupa-uc.a.run.app';
const VIZ_API_TOKEN = process.env.NWSL_VIZ_TOKEN;

export interface ShotMapEnvelope {
  imageUrl: string;
  summary: string;
  meta?: Record<string, unknown> | null;
  metrics?: {
    total_shots?: number;
    goals?: number;
    conversion_rate?: number;
  };
}

async function vizFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${VIZ_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (VIZ_API_TOKEN) {
    headers['Authorization'] = `Bearer ${VIZ_API_TOKEN}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err?.error) {
        message = err.error;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

type ShotMapServiceResponse = {
  render?: { url?: string | null } | null;
  legacy?: { image_url?: string | null } | null;
  summary?: string | null;
  data?: { metrics?: Record<string, number | undefined> } | Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
};

export async function generateShotMap(params: {
  teamName: string;
  season?: number;
  forceRefresh?: boolean;
}): Promise<ShotMapEnvelope> {
  const { teamName, season, forceRefresh } = params;
  const response = await vizFetch<ShotMapServiceResponse>(
    '/generate_shot_map',
    {
      team_name: teamName,
      season,
      force_refresh: Boolean(forceRefresh),
    }
  );

  const imageUrl = response.render?.url || response.legacy?.image_url;
  if (!imageUrl) {
    throw new Error('Shot map response missing image URL');
  }

  const rawData = response.data;
  let metrics: Record<string, number | undefined> | null = null;

  if (rawData && typeof rawData === 'object' && 'metrics' in rawData) {
    const extracted = (rawData as { metrics?: Record<string, number | undefined> }).metrics;
    metrics = extracted ?? null;
  } else if (rawData && typeof rawData === 'object') {
    metrics = rawData as Record<string, number | undefined>;
  }

  return {
    imageUrl,
    summary: response.summary ?? '',
    meta: response.meta,
    metrics,
  };
}
