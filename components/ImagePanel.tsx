'use client';

import { useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import Image from 'next/image';

interface ImageTab {
  label: string;
  imagePath: string;
}

interface ImagePanelProps {
  tabs: ImageTab[];
  height?: number | string;
}

export function ImagePanel({
  tabs,
  height = 400,
}: ImagePanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  const currentImage = tabs[activeTab]?.imagePath;

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
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
      </Box>

      {/* Image Display */}
      <Box sx={{ flexGrow: 1, width: '100%', position: 'relative', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentImage && (
          <Image
            src={currentImage}
            alt={tabs[activeTab]?.label || 'Image'}
            fill
            style={{ objectFit: 'contain' }}
          />
        )}
      </Box>
    </Paper>
  );
}
