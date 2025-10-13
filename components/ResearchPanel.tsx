'use client';

import { Paper, Box, Typography, List, ListItemButton } from '@mui/material';

type LinkItem = { label: string; href: string };

interface ResearchPanelProps {
  heading?: string;
  links: LinkItem[];
  height?: number | string;
}

export function ResearchPanel({ heading = 'RESEARCH', links, height = 400 }: ResearchPanelProps) {
  return (
    <Paper elevation={0} square sx={{ height, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Heading */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ px: 1.5 }}>
          <Typography component="h3" sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: 0.2, color: 'text.secondary', py: 0.75 }}>
            {heading}
          </Typography>
        </Box>
      </Box>

      {/* Links list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List disablePadding dense>
          {links.map((link, idx) => (
            <ListItemButton
              key={idx}
              component="a"
              href={link.href}
              sx={{
                px: 1.5,
                py: 0.75,
                borderBottom: '1px solid',
                borderColor: 'divider',
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
