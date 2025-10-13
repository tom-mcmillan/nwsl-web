'use client'

import { SessionProvider } from 'next-auth/react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

type Props = {
  children: React.ReactNode
}

const theme = createTheme({
  typography: {
    fontFamily:
      '"OpenAI Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
  },
})

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
