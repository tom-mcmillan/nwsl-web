import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      tier: 'FREE' | 'PRO'
    } & DefaultSession['user']
  }

  interface User {
    tier: 'FREE' | 'PRO'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tier?: 'FREE' | 'PRO'
  }
}
