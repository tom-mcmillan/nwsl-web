'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Paper, Typography, Tabs, Tab, TextField, InputAdornment, IconButton } from '@mui/material';

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

export function DataPanel({
  title,
  heading,
  data,
  tabs,
  height = 400,
  searchable,
  onTabChange,
}: DataPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  // Debounce the search input for smoother filtering on large tables
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(t);
  }, [query]);

  const handleTabChange = (newTab: number) => {
    setActiveTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

  // Use tabs if provided, otherwise use data
  const currentData = useMemo(() => {
    return tabs ? tabs[activeTab]?.data || [] : data || [];
  }, [tabs, activeTab, data]);

  // Filtering logic for search
  const filteredData = useMemo(() => {
    const source = (currentData || []) as Record<string, unknown>[];
    const q = debounced.toLowerCase();
    if (!q) return source;
    return source.filter((row) => {
      for (const v of Object.values(row)) {
        if (v === null || v === undefined) continue;
        if (typeof v === 'string' && v.toLowerCase().includes(q)) return true;
        if (typeof v === 'number' && String(v).includes(q)) return true;
      }
      return false;
    });
  }, [currentData, debounced]);

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
    ? Object.keys(currentData[0])
        .filter((key) => key.toLowerCase() !== 'id')
        .map((col) => {
          const firstValue = currentData[0][col];
          const isNumeric = typeof firstValue === 'number';
          const formatHeader = (key: string) => {
            const raw = key.replace(/_/g, ' ').trim();
            const lower = raw.toLowerCase();
          // Abbreviation mapping
          const abbrevMap: Record<string, string> = {
            xg: 'xG',
            xa: 'xA',
            xt: 'xT',
            psxg: 'PSxG',
            id: 'ID',
          };
          if (lower in abbrevMap) return abbrevMap[lower];
          if (lower.includes('xg + xa') || lower.includes('xg_plus_xa')) return 'xG + xA';
          // Sentence case default
          return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        };

        return {
          field: col,
          headerName: formatHeader(col),
          flex: 1,
          minWidth: 100,
          align: isNumeric ? 'right' : 'left',
          headerAlign: isNumeric ? 'right' : 'left',
          renderCell: (params) => {
            const value = params.value as unknown;
            if (typeof value !== 'string' || !debounced) return params.formattedValue as string;
            const lower = value.toLowerCase();
            const idx = lower.indexOf(debounced.toLowerCase());
            if (idx === -1) return value;
            const end = idx + debounced.length;
            return (
              <span>
                {value.slice(0, idx)}
                <mark style={{ backgroundColor: '#ffff66', padding: '0 1px' }}>{value.slice(idx, end)}</mark>
                {value.slice(end)}
              </span>
            );
          },
          
          cellClassName: (params) => {
            if (typeof params.value !== 'number') return '';
            
            if (col.includes('accuracy') || col.includes('per_90') || col.includes('rate')) {
              return params.value >= 0.5 ? 'positive' : 'negative';
            }
            return '';
          },
          
          valueFormatter: (value: unknown) => {
            if (typeof value !== 'number') return value as string;
            
            if (col.includes('accuracy') || col.includes('per_90') || col.includes('rate')) {
              return value.toFixed(2);
            }
            
            return value.toLocaleString();
          },
        };
      })
    : [];

  // Add row IDs
  const rows = (filteredData || []).map((row, index) => ({
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
      elevation={0}
      square
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      {/* Heading above Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {(heading || title) && (
          <Box sx={{ px: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Typography component="h3" sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: 0.2, color: 'text.secondary', py: 0.75 }}>
              {heading || title}
            </Typography>
            {searchable ? (
              <TextField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
                size="small"
                placeholder="Search rows"
                sx={{ ml: 'auto', width: 220 }}
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
          </Box>
        )}

        {tabs ? (
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => handleTabChange(newValue)}
            sx={{
              minHeight: 36,
              px: 1.5,
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
        ) : null}
      </Box>

      {/* Data Grid */}
      <Box sx={{ flexGrow: 1, width: '100%', overflow: 'auto' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          density="compact"
          disableRowSelectionOnClick
          hideFooter
          rowHeight={28}
          columnHeaderHeight={28}
          
          slots={searchable ? undefined : { toolbar: GridToolbar }}
          slotProps={searchable ? undefined : {
            toolbar: {
              showQuickFilter: true,
              csvOptions: {
                fileName: 'nwsl-data-export',
                delimiter: ',',
              },
            },
          }}
          
          sx={{
            border: 0,
            fontSize: '12px',
            '& .MuiDataGrid-cell': { fontSize: '12px', lineHeight: '1.3' },
            '& .MuiDataGrid-columnHeaders': {
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#bdbdbd',
              color: '#000000',
              borderBottom: '1px solid #d6d6d6',
            },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
            // Rows: all white, no alternating shading
            '& .MuiDataGrid-row': { backgroundColor: '#ffffff' },
            '& .MuiDataGrid-row, & .MuiDataGrid-cell': {
              borderBottom: '1px solid #f3f3f3 !important',
            },
          }}
        />
      </Box>
    </Paper>
  );
}
