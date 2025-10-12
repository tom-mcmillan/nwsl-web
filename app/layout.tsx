import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"
import Providers from '@/components/Providers'
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
              <div className="flex items-center gap-1 text-xs">
                <button className="px-3 py-1 bg-black text-white rounded font-medium shadow-sm">
                  Data
                </button>
                <button className="px-3 py-1 hover:bg-gray-100 rounded">
                  Research
                </button>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search"
                  className="px-3 py-1 border border-gray-300 rounded text-xs w-64 focus:outline-none focus:border-gray-400"
                />
                {session ? (
                  <Link
                    href="/account"
                    className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-100"
                  >
                    Account
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="px-3 py-1 bg-black text-white rounded text-xs font-semibold shadow-sm"
                  >
                    Log In
                  </Link>
                )}
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
