const API_URL = '/api/proxy';

export interface QueryRequest {
  query: string;
  options?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface QueryResult {
  [key: string]: unknown;
}

export interface QueryResponse {
  results: QueryResult[];
  row_count: number;
}

export interface SQLRequest {
  sql: string;
}

export interface SQLResponse {
  results: Record<string, unknown>[];
  row_count: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  role: string;
  endpoints: Record<string, string>;
  nwsl_database?: {
    status: string;
    error?: string;
  };
  agent?: {
    status: string;
    url?: string;
    note?: string;
    error?: string;
    http_status?: number;
  };
  user_database?: {
    status: string;
    note?: string;
    error?: string;
  };
  panel_cache?: {
    entries: number;
    ttl_seconds: number;
  };
}

class NWSLApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  async query(query: string, extras?: Omit<QueryRequest, 'query'>): Promise<QueryResponse> {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        query,
        ...extras,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Query failed with status ${response.status}`);
    }

    return response.json();
  }

  async sql(sql: string): Promise<SQLResponse> {
    const response = await fetch(`${this.baseUrl}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `SQL query failed with status ${response.status}`);
    }

    return response.json();
  }

  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new NWSLApiClient();
