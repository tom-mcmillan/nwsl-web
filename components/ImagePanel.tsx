'use client';

import { useState } from 'react';
import { Box, Paper, Tabs, Tab, Typography } from '@mui/material';
import Image from 'next/image';

interface ImageTab {
  label: string;
  imagePath: string;
}

interface ImagePanelProps {
  tabs: ImageTab[];
  heading?: string;
  height?: number | string;
  hideTabs?: boolean;
  onTabChange?: (tabIndex: number) => void;
}

export function ImagePanel({
  tabs,
  heading,
  height = 400,
  hideTabs,
  onTabChange,
}: ImagePanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (newTab: number) => {
    setActiveTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

  const currentImage = tabs[activeTab]?.imagePath;

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
      {/* Heading above Tabs (standardized) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {heading && (
          <Box sx={{ px: 1.5 }}>
            <Typography component="h3" sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: 0.2, color: 'text.secondary', py: 0.75 }}>
              {heading}
            </Typography>
          </Box>
        )}
        {!hideTabs ? (
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

      {/* Image Display */}
      <Box sx={{ flexGrow: 1, width: '100%', position: 'relative', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
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
