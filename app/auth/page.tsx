'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    try {
      setLoading(true)
      await signIn('google', { callbackUrl: '/' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Access NWSL Data</h1>
      <p className="text-sm text-gray-600">
        Sign in with your Google account to unlock the full NWSL Pro experience. All premium
        data and research tools are currently free while we gather feedback from early users.
      </p>
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed"
      >
        {loading ? 'Starting…' : 'Log in with Google'}
      </button>
      <p className="text-xs text-gray-500">
        Thanks for helping us shape the product—your usage may be anonymized for analytics.
      </p>
    </div>
  )
}
