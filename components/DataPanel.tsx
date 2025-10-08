'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Paper, Typography, Chip, Tabs, Tab } from '@mui/material';

interface TabData {
  label: string;
  data: Record<string, unknown>[];
}

interface DataPanelProps {
  title?: string;
  data?: Record<string, unknown>[];
  tabs?: TabData[];
  height?: number | string;
}

export function DataPanel({
  title,
  data,
  tabs,
  height = 400,
}: DataPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Use tabs if provided, otherwise use data
  const currentData = useMemo(() => {
    return tabs ? tabs[activeTab]?.data || [] : data || [];
  }, [tabs, activeTab, data]);

  useEffect(() => {
    // Validate data
    if (!currentData || currentData.length === 0) {
      setError('No data available');
    } else {
      setError(null);
    }
    setLoading(false);
  }, [currentData]);

  // Generate columns from data keys
  const columns: GridColDef[] = currentData && currentData.length > 0
    ? Object.keys(currentData[0]).map((col) => {
        const firstValue = currentData[0][col];
        const isNumeric = typeof firstValue === 'number';

        return {
          field: col,
          headerName: col.replace(/_/g, ' ').toUpperCase(),
          flex: 1,
          minWidth: 100,
          align: isNumeric ? 'right' : 'left',
          headerAlign: isNumeric ? 'right' : 'left',
        };
      })
    : [];

  // Add row IDs
  const rows = (currentData || []).map((row, index) => ({
    id: row.id || index,
    ...row,
  }));

  if (error) {
    return (
      <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">Error: {error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with Tabs or Title */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {tabs ? (
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                py: 0.5,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        ) : (
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="h3" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {title}
              </Typography>
              <Chip
                label={`${rows.length} rows`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Data Grid */}
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          density="compact"
          disableRowSelectionOnClick
          hideFooter
          sx={{
            border: 0,
            '& .MuiDataGrid-cell': { fontSize: '0.75rem' },
            '& .MuiDataGrid-columnHeaders': { fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'grey.50' },
          }}
        />
      </Box>
    </Paper>
  );
}
