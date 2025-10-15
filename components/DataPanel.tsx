'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { DeltaCell } from '@/components/DataGridCell';
import { WIREFRAME_MODE } from '@/lib/ui';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';

interface TabData {
  label: string;
  data: Record<string, unknown>[];
}

interface DataPanelProps {
  title?: string;
  heading?: string;
  data?: Record<string, unknown>[];
  tabs?: TabData[];
  height?: number | string;
  searchable?: boolean;
  onTabChange?: (tabIndex: number) => void;
}

const PERCENT_HINTS = ['pct', 'percent', 'rate', 'accuracy', 'share', 'ratio'];
const CHANGE_HINTS = ['chg', 'delta', 'diff', 'margin', 'spread', 'change'];

const ABBREV: Record<string, string> = {
  xg: 'xG',
  xa: 'xA',
  xt: 'xT',
  psxg: 'PSxG',
  id: 'ID',
};
const HEADER_OVERRIDES: Record<string, string> = {
  points: 'PTS',
  point: 'PTS',
  matches: 'MP',
  matches_played: 'MP',
  wins: 'W',
  draws: 'D',
  losses: 'L',
  goals_for: 'GF',
  goals_against: 'GA',
  goal_difference: 'GD',
  goals_per_match: 'GPM',
  goals_against_per_match: 'GAPM',
  shot_accuracy: 'SHOT%',
  pass_accuracy: 'PASS%',
  xg_diff: 'XG DIFF',
  vaep_per_match: 'VAEP/M',
  xt_per_match: 'XT/M',
};

const CHIP_FIELDS = new Set([
  'xg_diff',
  'xg difference',
  'vaep_per_match',
  'xt_per_match',
  'netchg',
  'net_chg',
  'change',
]);

const fieldRenderers: Record<string, (value: number | null) => JSX.Element> = {
  xg_diff: (value) => (
    <DeltaCell
      value={value}
      format={(v) =>
        v === null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
      }
    />
  ),
  vaep_per_match: (value) => (
    <DeltaCell
      value={value}
      format={(v) =>
        v === null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)
      }
    />
  ),
  xt_per_match: (value) => (
    <DeltaCell
      value={value}
      format={(v) =>
        v === null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)
      }
    />
  ),
};

function formatHeader(rawKey: string) {
  const raw = rawKey.replace(/_/g, ' ').trim();
  const lower = raw.toLowerCase();
  if (lower in HEADER_OVERRIDES) return HEADER_OVERRIDES[lower];
  if (lower in ABBREV) return ABBREV[lower];
  if (lower.includes('xg + xa') || lower.includes('xg_plus_xa')) return 'xG + xA';
  return raw.toUpperCase();
}

function formatNumeric(value: number, asPercent: boolean) {
  if (Number.isNaN(value)) return '—';
  if (asPercent) {
    return `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)}%`;
  }
  const fractionDigits = Math.abs(value) < 10 ? 2 : 1;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatChange(value: number | null, asPercent: boolean) {
  if (value === null) return '—';
  const abs = Math.abs(value);
  const formatted = asPercent
    ? `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(abs)}%`
    : new Intl.NumberFormat('en-US', {
        minimumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
        maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
      }).format(abs);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function DataPanel({
  title,
  heading,
  data,
  tabs,
  height = 300,
  searchable,
  onTabChange,
}: DataPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => clearTimeout(handle);
  }, [query]);

  const currentData = useMemo(() => (tabs ? tabs[activeTab]?.data ?? [] : data ?? []), [tabs, activeTab, data]);

  const filteredData = useMemo(() => {
    if (!debouncedQuery) return currentData;
    const q = debouncedQuery.toLowerCase();
    return currentData.filter((row) =>
      Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.toLowerCase().includes(q);
        if (typeof value === 'number') return value.toString().includes(q);
        return false;
      }),
    );
  }, [currentData, debouncedQuery]);

  useEffect(() => {
    setError(currentData.length ? null : 'No data available');
  }, [currentData]);

  if (WIREFRAME_MODE) {
    return (
      <Paper className="table-panel" elevation={0} square style={{ height }}>
        <div className="table-panel__header">
          <span>{heading || title}</span>
        </div>
        <div className="table-panel__body">
          <div className="wireframe-placeholder" />
        </div>
      </Paper>
    );
  }

  const columns: GridColDef[] =
    currentData && currentData.length > 0
      ? Object.keys(currentData[0])
          .filter((key) => key.toLowerCase() !== 'id')
          .map((field) => {
            const sample = currentData[0][field];
            const numeric = typeof sample === 'number';
            const lower = field.toLowerCase();
            const isPercent = PERCENT_HINTS.some((hint) => lower.includes(hint)) || lower.endsWith('_pct');
            const isChange = CHANGE_HINTS.some((hint) => lower.includes(hint)) || CHIP_FIELDS.has(lower);
            const headerName = formatHeader(field);

            return {
              field,
              headerName,
              flex: 1,
              minWidth: 100,
              type: numeric ? 'number' : 'string',
              align: numeric ? 'right' : 'left',
              headerAlign: numeric ? 'right' : 'left',
              headerClassName: 'grid-header',
              cellClassName: (params) => {
                const classes: string[] = [];
                if (numeric) classes.push('grid-cell--numeric');
                if (isChange && typeof params.value === 'number') {
                  if (params.value > 0) classes.push('grid-cell--positive');
                  if (params.value < 0) classes.push('grid-cell--negative');
                }
                return classes.join(' ');
              },
              valueFormatter: (value: unknown) => {
                if (value === null || value === undefined) return '—';
                if (typeof value === 'number') {
                  return isChange ? formatChange(value, isPercent) : formatNumeric(value, isPercent);
                }
                return value as string;
              },
              renderCell: (params) => {
                const gridValue = params.value as unknown;
                const lowerField = field.toLowerCase();
                const renderer = fieldRenderers[lowerField];

                if (renderer && (typeof gridValue === 'number' || gridValue === null)) {
                  return renderer(typeof gridValue === 'number' ? gridValue : null);
                }

                if (isChange && (typeof gridValue === 'number' || gridValue === null)) {
                  return (
                    <DeltaCell
                      value={typeof gridValue === 'number' ? gridValue : null}
                      format={(v) => formatChange(v, isPercent)}
                    />
                  );
                }

                if (typeof gridValue === 'string' && debouncedQuery) {
                  const lowerValue = gridValue.toLowerCase();
                  const idx = lowerValue.indexOf(debouncedQuery.toLowerCase());
                  if (idx !== -1) {
                    const end = idx + debouncedQuery.length;
                    return (
                      <span>
                        {gridValue.slice(0, idx)}
                        <mark className="grid-highlight">{gridValue.slice(idx, end)}</mark>
                        {gridValue.slice(end)}
                      </span>
                    );
                  }
                }

                return params.formattedValue as string;
              },
            } as GridColDef;
          })
      : [];

  const rows = filteredData.map((row, index) => ({ id: row.id ?? index, ...row }));

  if (error) {
    return (
      <Paper className="table-panel" elevation={0} square style={{ height }}>
        <div className="table-panel__header">
          <span>{heading || title}</span>
        </div>
        <div className="table-panel__empty">{error}</div>
      </Paper>
    );
  }

  const showToolbar = !searchable;

  return (
    <Paper className="table-panel" elevation={0} square style={{ height }}>
      <div className="table-panel__header">
        <span>{heading || title}</span>
        {searchable ? (
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('');
            }}
            size="small"
            placeholder="Search"
            sx={{ width: 140 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {query && (
                    <IconButton aria-label="clear" size="small" onClick={() => setQuery('')}>
                      ×
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        ) : null}
      </div>

      {tabs ? (
        <Tabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value);
            onTabChange?.(value);
          }}
          sx={{
            minHeight: 32,
            px: 1.25,
            borderBottom: '1px solid #e5e7eb',
            '& .MuiTab-root': {
              minHeight: 32,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: 0.08,
              textTransform: 'uppercase',
              paddingInline: 10,
              color: '#475569',
            },
            '& .MuiTab-root.Mui-selected': {
              color: '#0f172a',
            },
            '& .MuiTabs-indicator': {
              height: 2,
              backgroundColor: '#0f172a',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab key={tab.label ?? index} label={tab.label} />
          ))}
        </Tabs>
      ) : null}

      <Box className="table-panel__grid">
        <DataGrid
          rows={rows}
          style={{ height: '100%', width: '100%' }}
          columns={columns}
          density="compact"
          hideFooter
          disableRowSelectionOnClick
          rowHeight={24}
          columnHeaderHeight={24}
          slots={showToolbar ? { toolbar: GridToolbar } : undefined}
          slotProps={
            showToolbar
              ? {
                  toolbar: {
                    showQuickFilter: true,
                    csvOptions: { fileName: 'nwsl-data-export', delimiter: ',' },
                  },
                }
              : undefined
          }
          sx={{
            border: 0,
            fontSize: '12px',
            fontWeight: 500,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f3f4f7',
              borderBottom: '1px solid #d7dbe3',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#1f2937',
            },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e5e7eb',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '12px',
              color: '#111827',
              padding: '0 6px',
            },
            '& .grid-cell--positive': {
              color: '#0f766e',
              fontWeight: 600,
            },
            '& .grid-cell--negative': {
              color: '#b91c1c',
              fontWeight: 600,
            },
            '& .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell': {
              backgroundColor: '#fafbfd',
            },
            '& .MuiDataGrid-row:hover .MuiDataGrid-cell': {
              backgroundColor: '#edf2ff',
            },
          }}
        />
      </Box>
    </Paper>
  );
}
