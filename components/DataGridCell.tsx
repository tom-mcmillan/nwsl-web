'use client';

import { Box } from '@mui/material';

interface Props {
  value: number | null | undefined;
  format: (value: number | null) => string;
  align?: 'left' | 'right' | 'center';
}

export function DeltaCell({ value, format, align = 'right' }: Props) {
  const numeric = typeof value === 'number' ? value : null;
  const text = format(numeric);

  const isPositive = numeric !== null && numeric > 0;
  const isNegative = numeric !== null && numeric < 0;

  const backgroundColor = isPositive
    ? '#11a05c'
    : isNegative
      ? '#d64848'
      : 'transparent';
  const color = isPositive || isNegative ? '#ffffff' : '#111827';
  const arrow = numeric === null ? '' : isPositive ? '▲ ' : isNegative ? '▼ ' : '';

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center',
        minWidth: 64,
        padding: backgroundColor === 'transparent' ? 0 : '2px 6px',
        borderRadius: backgroundColor === 'transparent' ? 0 : '3px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        backgroundColor,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {arrow}
      {text}
    </Box>
  );
}
