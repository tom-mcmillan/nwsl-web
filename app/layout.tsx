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
  const mainNavLinks = [
    { label: 'Dashboard', href: '/', isActive: true },
    { label: 'Research', href: '/query', isActive: false },
    { label: 'SQL Explorer', href: '/explore', isActive: false },
    {
      label: 'Admin',
      href: isPro ? '/admin' : '/account',
      isActive: false,
      requiresPro: true,
    },
  ] as const
  const secondaryTabs = [
    { label: 'Market Monitor', isActive: true },
    { label: 'Team Performance', isActive: false },
    { label: 'Player Valuation', isActive: false },
    { label: 'Goalkeepers', isActive: false },
    { label: 'Momentum', isActive: false },
  ] as const

  return (
    <html lang="en">
      <head>
        <script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          async
        ></script>
      </head>
      <body className="app-body">
        <header className="app-header">
          <div className="app-topbar">
            <Link href="/" className="app-brand">
              <span className="app-brand__logo">NWSL Data</span>
              {isPro ? <span className="app-brand__badge">PRO</span> : null}
            </Link>
            <nav className="app-nav">
              {mainNavLinks.map(({ label, href, isActive, requiresPro }) => (
                <Link
                  key={label}
                  href={href}
                  className={`app-nav__link${isActive ? ' app-nav__link--active' : ''}${requiresPro && !isPro ? ' app-nav__link--disabled' : ''}`}
                  aria-disabled={requiresPro && !isPro}
                >
                  {label}
                  {requiresPro ? <span className="app-nav__pill">PRO</span> : null}
                </Link>
              ))}
            </nav>
            <div className="app-toolbar">
              <form className="app-search" role="search">
                <label htmlFor="global-search" className="sr-only">
                  Search
                </label>
                <input
                  id="global-search"
                  name="q"
                  type="search"
                  placeholder="Type to search data..."
                />
              </form>
              <button type="button" className="app-toolbar__btn" aria-label="Help">
                ?
              </button>
              <button type="button" className="app-toolbar__btn" aria-label="Notifications">
                !
              </button>
              <Link href={isPro ? '/account' : '/auth'} className="app-toolbar__btn app-toolbar__btn--primary">
                {session ? 'Account' : 'Sign in'}
              </Link>
            </div>
          </div>
          <div className="app-subnav">
            <div className="app-subnav__tabs">
              {secondaryTabs.map(({ label, isActive }) => (
                <button
                  key={label}
                  type="button"
                  className={`app-subnav__tab${isActive ? ' app-subnav__tab--active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="app-subnav__actions">
              <button type="button" className="app-subnav__action">View All</button>
              <button type="button" className="app-subnav__action">Do Not Show Again</button>
            </div>
          </div>
          <div className="app-statbar">
            <div className="app-statbar__items">
              {statLineItems.map(({ label, value }) => (
                <span key={label} className="app-stat">
                  <span className="app-stat__label">{label}</span>
                  <span className="app-stat__value">{value}</span>
                </span>
              ))}
            </div>
            {!stats ? (
              <span className="app-stat app-stat--warning">DATA OFFLINE</span>
            ) : null}
          </div>
        </header>
        <Providers>
          <main className="app-main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
