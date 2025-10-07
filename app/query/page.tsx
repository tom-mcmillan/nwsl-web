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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Natural Language Query
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Ask questions about NWSL data in plain English
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about NWSL data..."
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Query'}
          </button>
        </div>
      </form>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Example queries:
        </h2>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, i) => (
            <button
              key={i}
              onClick={() => setQuery(example)}
              className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Results ({result.row_count} {result.row_count === 1 ? 'result' : 'results'})
          </h2>
          <div className="space-y-4">
            {result.results.map((item, i: number) => (
              <div key={i} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                {item.summary && (
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Summary:</h3>
                    <p className="text-gray-700 dark:text-gray-300">{item.summary}</p>
                  </div>
                )}
                {item.analysis && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Analysis:</h3>
                    <p className="text-gray-700 dark:text-gray-300">{item.analysis}</p>
                  </div>
                )}
                {item.data ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data:</h3>
                    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
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
