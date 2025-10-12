import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.tier = (token.tier as 'FREE' | 'PRO') ?? 'FREE'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        const typed = user as { tier?: 'FREE' | 'PRO' }
        token.tier = typed.tier ?? 'PRO'
      } else if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { tier: true },
        })
        token.tier = dbUser?.tier ?? 'PRO'
      }
      return token
    },
  },
  pages: {
    signIn: '/auth',
  },
}

export type AppSession = {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    tier: 'FREE' | 'PRO'
  }
} & Awaited<ReturnType<typeof import('next-auth').getServerSession>>
