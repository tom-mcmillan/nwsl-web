'use client';

import { Paper, Box, List, ListItemButton } from '@mui/material';
import { WIREFRAME_MODE } from '@/lib/ui';

type LinkItem = { label: string; href: string };

interface ResearchPanelProps {
  heading?: string;
  links: LinkItem[];
  height?: number | string;
}

export function ResearchPanel({ heading = 'RESEARCH', links, height = 320 }: ResearchPanelProps) {
  if (WIREFRAME_MODE) {
    return (
      <Paper elevation={0} square className="table-panel" style={{ height }}>
        <Box className="table-panel__header">
          <span>{heading}</span>
        </Box>
        <div className="table-panel__body wireframe-placeholder" />
      </Paper>
    );
  }

  return (
    <Paper elevation={0} square className="table-panel" style={{ height }}>
      <Box className="table-panel__header">
        <span>{heading}</span>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List disablePadding dense>
          {links.map((link, idx) => (
            <ListItemButton
              key={idx}
              component="a"
              href={link.href}
              sx={{
                px: 1.25,
                py: 0.65,
                borderBottom: '1px solid #e5e7eb',
                fontSize: '12px',
                lineHeight: 1.3,
              }}
            >
              {link.label}
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Paper>
  );
}
