'use client';

import { Paper } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface DataGridProps {
  data: Record<string, unknown>[];
  title?: string;
  height?: number | string;
}

const ABBREV: Record<string, string> = {
  xg: 'xG',
  xa: 'xA',
  xt: 'xT',
  psxg: 'PSxG',
  id: 'ID',
};

const formatHeader = (key: string) => {
  const raw = key.replace(/_/g, ' ').trim();
  const lower = raw.toLowerCase();
  if (lower in ABBREV) return ABBREV[lower];
  if (lower.includes('xg + xa') || lower.includes('xg_plus_xa')) return 'xG + xA';
  return raw.toUpperCase();
};

export default function GenericDataGrid({ data, title, height = 480 }: DataGridProps) {
  if (!data || data.length === 0) {
    return (
      <Paper className="dashboard-panel" elevation={0} square style={{ height }}>
        <div className="dashboard-panel__body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="text-sm text-slate-600">No data available</span>
        </div>
      </Paper>
    );
  }

  const columns: GridColDef[] = Object.keys(data[0])
    .filter((k) => k.toLowerCase() !== 'id')
    .map((field) => {
      const sample = data[0][field];
      const numeric = typeof sample === 'number';
      return {
        field,
        headerName: formatHeader(field),
        flex: 1,
        minWidth: 110,
        type: numeric ? 'number' : 'string',
        align: numeric ? 'right' : 'left',
        headerAlign: numeric ? 'right' : 'left',
      } as GridColDef;
    });

  const rows = data.map((row, index) => ({
    id: row.id ?? index,
    ...row,
  }));

  return (
    <Paper className="dashboard-panel" elevation={0} square style={{ height }}>
      {title ? (
        <div className="dashboard-panel__header">
          <span>{title}</span>
        </div>
      ) : null}
      <div className="dashboard-panel__body dashboard-panel__body--grid">
        <DataGrid
          rows={rows}
          columns={columns}
          density="compact"
          hideFooter
          disableRowSelectionOnClick
          rowHeight={24}
          columnHeaderHeight={24}
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
            '& .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell': {
              backgroundColor: '#fafbfd',
            },
            '& .MuiDataGrid-row:hover .MuiDataGrid-cell': {
              backgroundColor: '#edf2ff',
            },
          }}
        />
      </div>
    </Paper>
  );
}
