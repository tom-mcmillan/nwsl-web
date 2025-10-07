import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NWSL Data",
  description: "National Women's Soccer League data and analytics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                NWSL Data <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded ml-1 align-middle font-bold">PRO</span>
              </Link>
              <div className="flex items-center gap-1 text-xs">
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Shortcuts</button>
                <button className="px-2 py-1 bg-orange-500 text-white rounded font-medium">Dashboard</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">News</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Research</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Screener</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Companies</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Markets & Deals</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Industries</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Geographies</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">ESG</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Tools</button>
                <button className="px-2 py-1 hover:bg-gray-100 rounded">Sitemap</button>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search"
                  className="px-3 py-1 border border-gray-300 rounded text-xs w-64 focus:outline-none focus:border-gray-400"
                />
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
