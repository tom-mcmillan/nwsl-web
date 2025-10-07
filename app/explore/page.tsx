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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-medium mb-6">SQL Explorer</h1>
      <p className="mb-6 text-sm">Direct database access (read-only). Only SELECT and WITH statements are allowed.</p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT * FROM matches LIMIT 10;"
            rows={10}
            className="w-full px-4 py-3 text-sm"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading || !sql.trim()}
          className="px-6 py-2"
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </button>
      </form>

      <div className="mb-8">
        <h2 className="font-medium mb-3">Example Queries</h2>
        <div className="space-y-2">
          {exampleQueries.map((example, i) => (
            <button
              key={i}
              onClick={() => setSql(example)}
              className="block w-full text-left px-4 py-2 text-xs font-mono"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-8 border border-red-600 p-4">
          <h3 className="font-medium mb-2">SQL Error</h3>
          <p className="text-sm font-mono">{error}</p>
        </div>
      )}

      {result && (
        <div>
          <h2 className="font-medium mb-4">
            Results ({result.row_count} {result.row_count === 1 ? 'row' : 'rows'})
          </h2>
          {result.results.length > 0 ? (
            <div className="border border-black overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {Object.keys(result.results[0]).map((key) => (
                      <th key={key}>{key.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="text-sm">
                          {value === null ? '—' : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
