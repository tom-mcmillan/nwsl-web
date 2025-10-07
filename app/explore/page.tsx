'use client';

import { useState } from 'react';
import { apiClient, SQLResponse } from '@/lib/api';

export default function ExplorePage() {
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SQLResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sql.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.sql(sql);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'SELECT player_name, goals FROM player_stats ORDER BY goals DESC LIMIT 10',
    'SELECT team, AVG(attendance) as avg_attendance FROM matches GROUP BY team',
    'SELECT * FROM matches WHERE match_date >= \'2024-01-01\' LIMIT 20',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          SQL Explorer
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Execute SQL queries directly against the NWSL database
        </p>
        <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
          Note: Only SELECT and WITH statements are allowed (read-only access)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="Enter your SQL query..."
            rows={6}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 font-mono text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !sql.trim()}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </button>
      </form>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Example queries:
        </h2>
        <div className="space-y-2">
          {exampleQueries.map((example, i) => (
            <button
              key={i}
              onClick={() => setSql(example)}
              className="block w-full text-left text-sm px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-mono"
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
            Results ({result.row_count} {result.row_count === 1 ? 'row' : 'rows'})
          </h2>
          {result.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {Object.keys(result.results[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {result.results.map((row, i: number) => (
                    <tr key={i}>
                      {Object.values(row).map((value, j: number) => (
                        <td
                          key={j}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                        >
                          {value === null ? 'NULL' : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}
