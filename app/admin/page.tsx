import { redirect } from 'next/navigation'

import AdminBuilder from './AdminBuilder'
import { getCurrentSession } from '@/lib/server/session'

export default async function AdminPage() {
  const session = await getCurrentSession()

  if (!session || session.user.tier !== 'PRO') {
    redirect('/upgrade')
  }

  return <AdminBuilder />
}
