'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper } from '@mui/material';

interface DataGridProps {
  data: any[];
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
  const columns: GridColDef[] = Object.keys(data[0]).map((key) => ({
    field: key,
    headerName: key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    flex: 1,
    minWidth: 150,
  }));

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
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
        }}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Paper>
  );
}
