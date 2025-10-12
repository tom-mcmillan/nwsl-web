import { redirect } from 'next/navigation'

import { getCurrentSession } from '@/lib/server/session'

export default async function AccountPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/auth')
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Account</h1>
      <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Membership</p>
            <p className="text-xs text-gray-600">NWSL Pro (complimentary)</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        We&apos;re waiving subscription fees during the early-access period. Stay tuned for
        updates as we roll out billing later this year.
      </p>
    </div>
  )
}
