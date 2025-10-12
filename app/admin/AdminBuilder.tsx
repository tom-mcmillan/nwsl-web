'use client'

import { useCallback, useEffect, useState } from 'react'

import type { AdminPanelDefinition } from '@/lib/server/apiClient'

type PanelTabDraft = {
  id: string
  label: string
  description?: string
  sql: string
  position: number
}

type PanelDraft = {
  slug: string
  title: string
  description?: string
  max_rows: number
  tags: string[]
  tabs: PanelTabDraft[]
}

function emptyPanel(): PanelDraft {
  return {
    slug: '',
    title: '',
    description: '',
    max_rows: 100,
    tags: [],
    tabs: [
      {
        id: crypto.randomUUID(),
        label: 'New Tab',
        description: '',
        sql: '',
        position: 0,
      },
    ],
  }
}

export default function AdminBuilder() {
  const [panels, setPanels] = useState<PanelDraft[]>([])
  const [draft, setDraft] = useState<PanelDraft>(emptyPanel)
  const [originalSlug, setOriginalSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPanels = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/panels', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load panels')
      }
      const data: { panels?: AdminPanelDefinition[] } = await res.json()
      const normalized = (data.panels ?? []).map((panel) => ({
        slug: panel.slug,
        title: panel.title,
        description: panel.description ?? '',
        max_rows: panel.max_rows ?? 100,
        tags: panel.tags ?? [],
        tabs: (panel.tabs ?? []).map((tab, idx) => ({
          id: tab.id,
          label: tab.label,
          description: tab.description ?? '',
          sql: tab.sql ?? '',
          position: tab.position ?? idx,
        })),
      })) as PanelDraft[]
      setPanels(normalized)
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPanels()
    const timer = setInterval(loadPanels, 60_000)
    return () => clearInterval(timer)
  }, [loadPanels])

  function handleSelect(slug: string) {
    const found = panels.find((panel) => panel.slug === slug)
    if (!found) return
    setDraft({
      ...found,
      tabs: found.tabs
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((tab, idx) => ({ ...tab, position: idx })),
    })
    setOriginalSlug(slug)
    setError(null)
    setMessage(null)
  }

  function handleAddTab() {
    setDraft((prev) => ({
      ...prev,
      tabs: [
        ...prev.tabs,
        {
          id: crypto.randomUUID(),
          label: `Tab ${prev.tabs.length + 1}`,
          description: '',
          sql: '',
          position: prev.tabs.length,
        },
      ],
    }))
  }

  function handleTabChange(index: number, key: keyof PanelTabDraft, value: string) {
    setDraft((prev) => {
      const tabs = [...prev.tabs]
      tabs[index] = { ...tabs[index], [key]: value }
      return { ...prev, tabs }
    })
  }

  function handleRemoveTab(index: number) {
    setDraft((prev) => {
      const tabs = prev.tabs.filter((_, i) => i !== index).map((tab, idx) => ({
        ...tab,
        position: idx,
      }))
      return { ...prev, tabs }
    })
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    setMessage(null)

    const payload: PanelDraft = {
      ...draft,
      slug: draft.slug.trim(),
      title: draft.title.trim(),
      description: draft.description?.trim(),
      tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
      tabs: draft.tabs.map((tab, idx) => ({
        ...tab,
        label: tab.label.trim(),
        description: tab.description?.trim(),
        sql: tab.sql.trim(),
        position: idx,
      })),
    }

    if (!payload.slug || !payload.title) {
      setLoading(false)
      setError('Slug and title are required.')
      return
    }

    if (payload.tabs.length === 0) {
      setLoading(false)
      setError('At least one tab is required.')
      return
    }

    const url =
      originalSlug && originalSlug === payload.slug
        ? `/api/admin/panels/${encodeURIComponent(payload.slug)}`
        : '/api/admin/panels'

    const method = originalSlug && originalSlug === payload.slug ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody?.error || 'Failed to save panel')
      }

      await loadPanels()
      setOriginalSlug(payload.slug)
      setMessage('Panel saved successfully.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete panel "${slug}"? This cannot be undone.`)) {
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/panels/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody?.error || 'Failed to delete panel')
      }

      await loadPanels()
      setDraft(emptyPanel())
      setOriginalSlug(null)
      setMessage('Panel deleted.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleNewPanel() {
    setDraft(emptyPanel())
    setOriginalSlug(null)
    setError(null)
    setMessage(null)
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl gap-6 px-6 py-10">
      <aside className="w-64 border-r border-gray-200 pr-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Panels</h1>
          <button
            className="rounded bg-black px-3 py-1 text-xs font-medium text-white"
            onClick={handleNewPanel}
          >
            New
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Select an existing panel to edit or create a new one.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {panels.map((panel) => (
            <li key={panel.slug} className="flex items-center justify-between">
              <button
                className={`truncate text-left ${
                  originalSlug === panel.slug
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700'
                }`}
                onClick={() => handleSelect(panel.slug)}
              >
                {panel.title}
              </button>
              <button
                className="text-xs text-red-500"
                onClick={() => handleDelete(panel.slug)}
                title="Delete panel"
              >
                Delete
              </button>
            </li>
          ))}
          {panels.length === 0 && !loading ? (
            <li className="text-xs text-gray-500">
              No panels saved yet. Create one to get started.
            </li>
          ) : null}
        </ul>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="mb-4">
          <h2 className="text-2xl font-semibold">
            {originalSlug ? `Editing: ${originalSlug}` : 'Create a new panel'}
          </h2>
          <p className="text-sm text-gray-600">
            Define panel metadata, author SQL tabs, and publish to the dashboard.
          </p>
        </header>

        <div className="space-y-6">
          {message ? (
            <div className="rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="space-y-3 rounded border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase text-gray-500">Panel Details</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-gray-600">
                Slug
                <input
                  className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="league-standings"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Title
                <input
                  className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="League Standings"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Max Rows
                <input
                  type="number"
                  className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                  value={draft.max_rows}
                  min={1}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      max_rows: Number.parseInt(e.target.value, 10) || 1,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Tags (comma separated)
                <input
                  className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                  value={draft.tags.join(', ')}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      tags: e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </label>
            </div>
            <label className="text-xs font-medium text-gray-600 block">
              Description
              <textarea
                className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                rows={3}
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="One or two sentences describing the panel."
              />
            </label>
          </section>

          <section className="space-y-4 rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase text-gray-500">Tabs</h3>
              <button
                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                onClick={handleAddTab}
              >
                Add Tab
              </button>
            </div>

            {draft.tabs.map((tab, index) => (
              <div key={tab.id} className="space-y-2 rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-500">
                    Tab {index + 1}
                  </span>
                  <button
                    className="text-xs text-red-500"
                    onClick={() => handleRemoveTab(index)}
                    disabled={draft.tabs.length === 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-medium text-gray-600">
                    ID
                    <input
                      className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                      value={tab.id}
                      onChange={(e) => handleTabChange(index, 'id', e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-medium text-gray-600">
                    Label
                    <input
                      className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                      value={tab.label}
                      onChange={(e) => handleTabChange(index, 'label', e.target.value)}
                    />
                  </label>
                </div>
                <label className="text-xs font-medium text-gray-600 block">
                  Description
                  <input
                    className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm"
                    value={tab.description ?? ''}
                    onChange={(e) => handleTabChange(index, 'description', e.target.value)}
                  />
                </label>
                <label className="text-xs font-medium text-gray-600 block">
                  SQL
                  <textarea
                    className="mt-1 w-full border border-gray-300 px-2 py-2 font-mono text-xs"
                    rows={8}
                    value={tab.sql}
                    onChange={(e) => handleTabChange(index, 'sql', e.target.value)}
                    placeholder="SELECT ... FROM ..."
                  />
                </label>
              </div>
            ))}
          </section>

          <div className="flex items-center gap-3">
            <button
              className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Publish Panel'}
            </button>
            {originalSlug ? (
              <span className="text-xs text-gray-500">
                Changes apply to <strong>{originalSlug}</strong>
              </span>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
