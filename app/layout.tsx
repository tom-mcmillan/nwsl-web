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
          <div className="px-4 py-2">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-black font-semibold text-sm">
                NWSL Data
                {isPro ? (
                  <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded ml-1 align-middle font-bold">
                    PRO
                  </span>
                ) : null}
              </Link>
              {stats ? (
                <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="uppercase tracking-wide text-gray-500">Events</span>
                    <span className="font-semibold text-gray-900">
                      {stats.events.toLocaleString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="uppercase tracking-wide text-gray-500">Passes</span>
                    <span className="font-semibold text-gray-900">
                      {stats.passes.toLocaleString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="uppercase tracking-wide text-gray-500">Shots</span>
                    <span className="font-semibold text-gray-900">
                      {stats.shots.toLocaleString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="uppercase tracking-wide text-gray-500">Matches</span>
                    <span className="font-semibold text-gray-900">
                      {stats.matches.toLocaleString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="uppercase tracking-wide text-gray-500">Players</span>
                    <span className="font-semibold text-gray-900">
                      {stats.players.toLocaleString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="uppercase tracking-wide text-gray-500">Seasons</span>
                    <span className="font-semibold text-gray-900">
                      {stats.seasons.toLocaleString()}
                    </span>
                  </span>
                </div>
              ) : null}
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
