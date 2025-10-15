import 'server-only';
import type { HealthResponse, QueryRequest, QueryResponse } from '@/lib/api';

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
const API_KEY = process.env.NWSL_API_KEY ?? 'public_dev_dashboard_key';
const PANEL_ADMIN_TOKEN = process.env.NWSL_PANEL_ADMIN_TOKEN;

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

export async function executeQuery(
  query: string,
  extras?: Omit<QueryRequest, 'query'>
) {
  return backendFetch<QueryResponse>(
    '/query',
    {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...extras,
      }),
    },
    'Query execution failed'
  );
}

export interface DashboardSummaryResponse {
  seasonYear: number;
  headline: {
    matches: number;
    players: number;
    teams: number;
    events: number;
  };
  lastUpdated: string;
}

export interface DashboardTotalsResponse {
  totals: {
    events: number;
    passes: number;
    shots: number;
    matches: number;
    players: number;
    seasons: number;
  };
  seasonYears: number[];
  lastUpdated: string;
}

export async function fetchDashboardTotals() {
  return backendFetch<DashboardTotalsResponse>(
    '/dashboard/totals',
    undefined,
    'Failed to load dashboard totals'
  );
}

export interface TeamOverviewResponse {
  seasonYear: number;
  competition: string;
  leagueAverages: {
    goalsPerMatch: number | null;
    shotsPerMatch: number | null;
    passAccuracyPct: number | null;
    homeWinPct: number | null;
  };
  teamTable: {
    columns: string[];
    rows: (string | number | null)[][];
  };
  barChart: {
    series: Array<{
      name: string;
      data: Array<{ team: string; value: number }>;
    }>;
  };
  teamFilter: {
    selectedTeamId: string | null;
    selectedTeamName: string;
    availableTeams: Array<{ teamId: string; teamName: string }>;
  };
}

export interface PlayerValuationResponse {
  seasonYear: number;
  competition: string;
  teamFilter: {
    selectedTeamId: string | null;
    availableTeams: Array<{ teamId: string; teamName: string }>;
  };
  filters: {
    minMinutes: number;
    limit: number;
    orderBy: 'vaep' | 'xt';
  };
  headline: {
    topXg: null | { playerId: string; playerName: string; teamName: string; value: number | null };
    topXt: null | { playerId: string; playerName: string; teamName: string; value: number | null };
    medianVaep: number | null;
  };
  players: Array<{
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    minutes: number;
    matches: number;
    goals: number;
    assists: number;
    shots: number;
    shotAccuracy: number | null;
    xg: number | null;
    xa: number | null;
    xt: number | null;
    vaepTotal: number | null;
    vaepOffensive: number | null;
    vaepDefensive: number | null;
  }>;
  valueFlow: {
    nodes: Array<{ id: string; label: string; type: 'team' | 'player'; teamId?: string }>;
    links: Array<{
      source: string;
      target: string;
      weight: number;
      vaep: number | null;
      offensiveVaep: number | null;
      defensiveVaep: number | null;
    }>;
  };
}

export interface GoalkeeperDashboardResponse {
  seasonYear: number;
  competition: string;
  teamFilter: {
    selectedTeamId: string | null;
    availableTeams: Array<{ teamId: string; teamName: string }>;
  };
  headline: {
    bestSavePct: null | { playerId: string; playerName: string; teamName: string; value: number | null };
    cleanSheetsLeader: null | { playerId: string; playerName: string; teamName: string; value: number | null };
    distributionLeader: null | { playerId: string; playerName: string; teamName: string; value: number | null };
  };
  goalkeepers: {
    columns: string[];
    rows: Array<{
      playerId: string;
      playerName: string;
      teamName: string;
      matches: number;
      saves: number;
      goalsConceded: number;
      savePct: number;
      cleanSheets: number;
      psxg?: number | null;
      psxgPlusMinus?: number | null;
      distributionAccuracy: number | null;
      savesPer90?: number | null;
      goalsConcededPer90?: number | null;
    }>;
  };
}

export interface MomentumResponse {
  match: {
    matchId: string;
    matchDate: string | null;
    seasonYear: number;
    competition: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
  };
  momentum: {
    metric: string;
    window: number;
    series: Array<{
      team: string;
      teamId: string;
      points: Array<{ minute: number; value: number }>;
    }>;
  };
  events: Array<{
    minute: number;
    team: string | null;
    teamId?: string;
    player: string | null;
    event: string;
    detail: string | null;
  }>;
  valueFlow: {
    nodes: Array<{ id: string; label: string; clusterId?: number; clusterVersion?: string; type?: string }>;
    links: Array<{ source: string; target: string; weight: number; teamId?: string }>;
  };
}

export interface DashboardLookupsResponse {
  seasons: number[];
  teams: Array<{ teamId: string; teamName: string; shortName?: string }>;
  goalkeepers: Array<{ playerId: string; playerName: string; teamId: string; teamName: string }>;
  matches: Array<{ matchId: string; matchDate: string | null; label: string }>;
  players: Array<{ playerId: string; playerName: string; teamName: string }>;
}

export interface PlayerStylePrototype {
  prototypeId: number;
  actionType: string;
  stage: number;
  weight: number | null;
  share: number;
  alpha: number | null;
}

export interface PlayerStyleResponse {
  player: {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    seasonYear: number;
    competition: string;
    matchesPlayed: number;
    minutesPlayed: number;
  };
  radar: {
    metrics: Array<{ label: string; value: number | null; percentile: number }>;
    scale: string;
  };
  styleVector: null | {
    styleVector: unknown;
    passVector: unknown;
    crossVector: unknown;
    dribbleVector: unknown;
    shotVector: unknown;
  };
  stylePrototypes: PlayerStylePrototype[];
  heatmap: {
    imageUrl: string | null;
    data: unknown;
  };
  vaep: {
    total: number | null;
    offensive: number | null;
    defensive: number | null;
  };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchDashboardSummary(season?: number) {
  const qs = buildQuery({ season });
  return backendFetch<DashboardSummaryResponse>(`/dashboard/summary${qs}`, undefined, 'Failed to load dashboard summary');
}

export async function fetchTeamOverview(params: { season?: number; competition?: string }) {
  const qs = buildQuery({ season: params.season, competition: params.competition });
  return backendFetch<TeamOverviewResponse>(`/dashboard/team-overview${qs}`, undefined, 'Failed to load team overview');
}

export async function fetchPlayerValuation(params: {
  season?: number;
  competition?: string;
  teamId?: string | null;
  minMinutes?: number;
  limit?: number;
  orderBy?: 'vaep' | 'xt';
}) {
  const qs = buildQuery({
    season: params.season,
    competition: params.competition,
    teamId: params.teamId ?? undefined,
    minMinutes: params.minMinutes,
    limit: params.limit,
    orderBy: params.orderBy,
  });
  return backendFetch<PlayerValuationResponse>(`/dashboard/player-valuation${qs}`, undefined, 'Failed to load player valuation');
}

export async function fetchGoalkeeperDashboard(params: { season?: number; competition?: string; teamId?: string | null }) {
  const qs = buildQuery({
    season: params.season,
    competition: params.competition,
    teamId: params.teamId ?? undefined,
  });
  return backendFetch<GoalkeeperDashboardResponse>(`/dashboard/goalkeepers${qs}`, undefined, 'Failed to load goalkeeper dashboard');
}

export async function fetchMomentum(matchId: string) {
  const qs = buildQuery({ matchId });
  return backendFetch<MomentumResponse>(`/dashboard/momentum${qs}`, undefined, 'Failed to load match momentum');
}

export async function fetchDashboardLookups() {
  return backendFetch<DashboardLookupsResponse>(
    '/dashboard/lookups',
    undefined,
    'Failed to load dashboard lookups'
  );
}

export async function fetchPlayerStyle(params: { season?: number; competition?: string; playerId?: string; playerName?: string }) {
  const qs = buildQuery({
    season: params.season,
    competition: params.competition,
    playerId: params.playerId,
    playerName: params.playerName,
  });
  return backendFetch<PlayerStyleResponse>(`/dashboard/player-style${qs}`, undefined, 'Failed to load player style');
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
