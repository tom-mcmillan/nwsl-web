export async function getCurrentSession() {
  // In environments without auth configured, avoid importing NextAuth/Prisma.
  const hasAuthEnv =
    !!process.env.DATABASE_URL &&
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    !!process.env.NEXTAUTH_SECRET;

  if (!hasAuthEnv) return null;

  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  return getServerSession(authOptions);
}
