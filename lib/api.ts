const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  results: Array<{
    analysis?: string;
    summary?: string;
    data?: any;
  }>;
  row_count: number;
}

export interface SQLRequest {
  sql: string;
}

export interface SQLResponse {
  results: any[];
  row_count: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  role: string;
  endpoints: {
    sql: string;
    query: string;
  };
  orchestrator?: {
    status: string;
    url: string;
  };
  database?: {
    status: string;
  };
}

class NWSLApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  async query(query: string): Promise<QueryResponse> {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
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
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `SQL query failed with status ${response.status}`);
    }

    return response.json();
  }

  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new NWSLApiClient();
