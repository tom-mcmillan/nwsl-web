'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

type Props = {
  children: React.ReactNode
}

const baseFontFamily =
  '"OpenAI Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'

const theme = createTheme({
  typography: {
    fontFamily: baseFontFamily,
    fontSize: 13,
    fontWeightRegular: 500,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    allVariants: {
      fontFamily: baseFontFamily,
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: 0.1,
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 13,
          fontWeight: 500,
          paddingTop: 6,
          paddingBottom: 6,
        },
        head: {
          fontWeight: 500,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          fontFamily: baseFontFamily,
          fontSize: 13,
          fontWeight: 500,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: baseFontFamily,
          fontSize: 13,
          fontWeight: 500,
        },
        input: {
          fontFamily: baseFontFamily,
          fontSize: 13,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: baseFontFamily,
          fontSize: 13,
          fontWeight: 500,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: baseFontFamily,
          fontSize: 13,
          fontWeight: 500,
        },
      },
    },
  },
})

export default function Providers({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
