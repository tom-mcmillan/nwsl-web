'use client';

import { useState } from 'react';
import { apiClient, QueryResponse } from '@/lib/api';

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.query(query);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'Who are the top 5 goal scorers in NWSL 2024?',
    'How did Portland Thorns perform at home vs away?',
    'Compare Sophia Smith and Trinity Rodman statistics',
    'Show me attendance trends across the league',
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-medium mb-6">Natural Language Query</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about NWSL data..."
            className="w-full px-4 py-3 text-base"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-2"
        >
          {loading ? 'Processing...' : 'Submit Query'}
        </button>
      </form>

      <div className="mb-8">
        <h2 className="font-medium mb-3">Example Queries</h2>
        <div className="space-y-2">
          {exampleQueries.map((example, i) => (
            <button
              key={i}
              onClick={() => setQuery(example)}
              className="block w-full text-left px-4 py-2 text-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-8 border border-red-600 p-4">
          <h3 className="font-medium mb-2">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="border border-black p-6">
          <h2 className="font-medium mb-4">
            Results ({result.row_count} {result.row_count === 1 ? 'result' : 'results'})
          </h2>
          <div className="space-y-6">
            {result.results.map((item, i) => (
              <div key={i} className="border-t border-gray-300 pt-4 first:border-t-0 first:pt-0">
                {item.summary && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Summary</h3>
                    <p className="text-sm">{item.summary}</p>
                  </div>
                )}
                {item.analysis && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Analysis</h3>
                    <p className="text-sm">{item.analysis}</p>
                  </div>
                )}
                {item.data ? (
                  <div>
                    <h3 className="font-medium mb-2">Data</h3>
                    <pre className="bg-gray-50 p-4 text-xs overflow-x-auto border border-gray-300">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
