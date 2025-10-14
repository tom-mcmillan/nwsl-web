import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"
import Providers from '@/components/Providers'
import { getWarehouseStats } from '@/lib/server/dbStats'
import { getCurrentSession } from '@/lib/server/session'

export const metadata: Metadata = {
  title: "NWSL Data",
  description: "National Women's Soccer League data and analytics platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession()
  const isPro = session?.user?.tier === 'PRO'
  const stats = await getWarehouseStats()
  const statLineItems: Array<{ label: string; value: string }> = [
    { label: 'Events', value: stats?.events ? stats.events.toLocaleString() : '—' },
    { label: 'Passes', value: stats?.passes ? stats.passes.toLocaleString() : '—' },
    { label: 'Shots', value: stats?.shots ? stats.shots.toLocaleString() : '—' },
    { label: 'Players', value: stats?.players ? stats.players.toLocaleString() : '—' },
    { label: 'Seasons', value: stats?.seasons ? stats.seasons.toLocaleString() : '—' },
    { label: 'Matches', value: stats?.matches ? stats.matches.toLocaleString() : '—' },
  ]

  return (
    <html lang="en">
      <head>
        <script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          async
        ></script>
      </head>
      <body className="antialiased bg-white text-black">
        <nav className="bg-white border-b border-gray-300">
          <div className="px-3 py-1.5">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-black font-semibold text-xl tracking-[0.18em] uppercase">
                NWSL Data
                {isPro ? (
                  <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded ml-1 align-middle font-bold">
                    PRO
                  </span>
                ) : null}
              </Link>
              <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] text-gray-700 uppercase tracking-wide">
                {statLineItems.map(({ label, value }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-900 text-base">{value}</span>
                  </span>
                ))}
                {!stats ? (
                  <span className="text-[10px] font-semibold text-orange-600 tracking-widest">
                    DATA OFFLINE
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </nav>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
