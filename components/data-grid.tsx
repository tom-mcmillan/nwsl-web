'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper } from '@mui/material';

interface DataGridProps {
  data: Record<string, unknown>[];
  title?: string;
}

/**
 * Generic MUI DataGrid wrapper component
 * Automatically infers columns from data structure
 */
export default function GenericDataGrid({ data, title }: DataGridProps) {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  // Auto-generate columns from first row
  const columns: GridColDef[] = Object.keys(data[0])
    .filter((k) => k.toLowerCase() !== 'id')
    .map((key) => {
    const raw = key.replace(/_/g, ' ').trim();
    const lower = raw.toLowerCase();
    const abbrevMap: Record<string, string> = {
      xg: 'xG',
      xa: 'xA',
      xt: 'xT',
      psxg: 'PSxG',
      id: 'ID',
    };
    const headerName =
      lower in abbrevMap
        ? abbrevMap[lower]
        : lower.includes('xg + xa') || lower.includes('xg_plus_xa')
        ? 'xG + xA'
        : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    return {
      field: key,
      headerName,
      flex: 1,
      minWidth: 150,
    } as GridColDef;
  });

  // Add unique ID if not present
  const rows = data.map((row, index) => ({
    id: row.id || index,
    ...row,
  }));

  return (
    <Paper sx={{ height: 600, width: '100%', p: 2 }}>
      {title && <h2 style={{ marginBottom: '1rem' }}>{title}</h2>}
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        hideFooter
        rowHeight={28}
        columnHeaderHeight={28}
        density="compact"
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'row--striped' : ''
        }
        sx={{
          border: 0,
          fontSize: '12px',
          '& .MuiDataGrid-cell': { fontSize: '12px', lineHeight: '1.3' },
          '& .MuiDataGrid-columnHeaders': {
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: '#bdbdbd',
            color: '#222222',
            borderBottom: '1px solid #d6d6d6',
          },
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
          '& .MuiDataGrid-row.row--striped': {
            backgroundColor: '#f3f3f3',
          },
          '& .MuiDataGrid-row.row--striped:hover': {
            backgroundColor: '#f0f0f0',
          },
          '& .MuiDataGrid-row, & .MuiDataGrid-cell': {
            borderBottom: '1px solid #f3f3f3 !important',
          },
        }}
      />
    </Paper>
  );
}
