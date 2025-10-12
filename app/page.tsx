'use client';

import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react'
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DataPanel } from '@/components/DataPanel';
import { ImagePanel } from '@/components/ImagePanel';
import panel1Tab1Data from '@/public/data/panel-1.json';
import panel1Tab2Data from '@/public/data/panel-1-tab-2.json';
import panel1Tab3Data from '@/public/data/panel-1-tab-3.json';

interface Stats {
  matches: number;
  players: number;
  actions: number;
  passes: number;
  xt_actions: number;
  shots: number;
}

const VerticalResizeHandle = () => (
  <PanelResizeHandle className="group flex w-1 cursor-col-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-500">
    <div className="h-8 w-0.5 rounded bg-gray-400 transition-colors group-hover:bg-white" />
  </PanelResizeHandle>
);

const HorizontalResizeHandle = () => (
  <PanelResizeHandle className="group flex h-1 cursor-row-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-500">
    <div className="h-0.5 w-8 rounded bg-gray-400 transition-colors group-hover:bg-white" />
  </PanelResizeHandle>
);

export default function Home() {
  const { data: session } = useSession()
  const isPro = session?.user?.tier === 'PRO'

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Track active tabs for dynamic context
  const [panel1ActiveTab, setPanel1ActiveTab] = useState(0);
  const [panel2ActiveTab, setPanel2ActiveTab] = useState(0);
  const [panel3ActiveTab, setPanel3ActiveTab] = useState(0);

  // Panel tab metadata
  const panel1Tabs = [
    { label: "Top Scorers 2025", data: panel1Tab1Data },
    { label: "Top Assists 2025", data: panel1Tab2Data },
    { label: "Top Keepers 2025", data: panel1Tab3Data }
  ];

  const panel2Tabs = [
    { label: "Bell Curve", imagePath: "/images/bell-curve.png" },
    { label: "Eden Hazard Goal SPADL", imagePath: "/images/eden_hazard_goal_spadl.webp" }
  ];

  // ChatKit setup with page context
  const { control } = useChatKit({
    api: {
      async getClientSecret(currentClientSecret) {
        // Build dynamic context about current page state
        const pageContext = {
          currentView: 'NWSL Dashboard',
          databaseStats: stats ? {
            matches: stats.matches,
            players: stats.players,
            spadl_actions: stats.actions,
            passes: stats.passes,
            xt_actions: stats.xt_actions,
            shots: stats.shots
          } : null,
          activeData: {
            panel1: {
              name: 'Top Left Panel',
              activeTab: panel1Tabs[panel1ActiveTab]?.label,
              dataType: 'Player Statistics',
              currentData: panel1Tabs[panel1ActiveTab]?.data,
              availableTabs: panel1Tabs.map(t => t.label)
            },
            panel2: {
              name: 'Top Right Panel',
              activeTab: panel2Tabs[panel2ActiveTab]?.label,
              dataType: 'Visualization',
              currentImage: panel2Tabs[panel2ActiveTab]?.imagePath,
              availableTabs: panel2Tabs.map(t => t.label)
            },
            panel3: {
              name: 'Bottom Panel',
              activeTab: panel1Tabs[panel3ActiveTab]?.label,
              dataType: 'Player Statistics',
              currentData: panel1Tabs[panel3ActiveTab]?.data,
              availableTabs: panel1Tabs.map(t => t.label)
            }
          },
          userCanInteract: {
            switchTabs: true,
            viewDifferentData: true,
            askAboutVisibleData: true
          }
        };

        if (!currentClientSecret) {
          // Create new session with context
          const res = await fetch('/api/chatkit/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: pageContext })
          });
          if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            throw new Error(errorBody?.error || 'Unable to start ChatKit session');
          }
          const data = await res.json();
          if (!data?.client_secret) {
            throw new Error('ChatKit session did not return a client secret');
          }
          return data.client_secret;
        }

        // Refresh existing session
        const res = await fetch('/api/chatkit/refresh', {
          method: 'POST',
          body: JSON.stringify({ currentClientSecret }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody?.error || 'Unable to refresh ChatKit session');
        }
        const data = await res.json();
        if (!data?.client_secret) {
          throw new Error('ChatKit refresh did not return a client secret');
        }
        return data.client_secret;
      },
    },
    theme: {
      colorScheme: 'light',
      radius: 'pill',
      density: 'normal',
      typography: {
        baseSize: 14,
        fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
        fontSources: [
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
            weight: 400,
            style: 'normal',
            display: 'swap'
          }
        ]
      }
    },
    composer: {
      placeholder: 'ask any question about the nwsl...',
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760
      },
      tools: [
        {
          id: 'search_docs',
          label: 'Search docs',
          shortLabel: 'Docs',
          placeholderOverride: 'Search documentation',
          icon: 'book-open',
          pinned: false
        }
      ],
    },
    startScreen: {
      greeting: '',
      prompts: [],
    },
  });

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      if (!isPro) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      try {
        const res = await fetch('/api/stats')
        if (!res.ok) {
          throw new Error('Failed to fetch statistics')
        }
        const statsData: Stats = await res.json()
        if (!cancelled) {
          setStats(statsData)
        }
      } catch (err) {
        console.error('Error fetching statistics:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      cancelled = true
    }
  }, [isPro])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Stats Bar */}
      <div className="bg-white border-b border-gray-300 shadow-sm">
        <div className="flex items-center px-3 py-1.5 gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Matches</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.matches || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Players</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.players || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">SPADL Actions</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.actions || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Passes</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.passes || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">xT Actions</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.xt_actions || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Shots</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.shots || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden p-2">
        {!isPro ? (
          <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Premium data is locked. <a href="/auth" className="font-semibold underline">Log in or upgrade to NWSL Pro</a> to access live panels.
          </div>
        ) : null}
        <PanelGroup
          direction="horizontal"
          className="flex h-full"
          autoSaveId="nwsl-dashboard-layout"
        >
          {/* Left Side - 4 Data Panels in 2 rows */}
          <Panel minSize={50} defaultSize={70}>
            <PanelGroup
              direction="vertical"
              className="flex h-full w-full"
              autoSaveId="nwsl-left-stack"
            >
              {/* Top Row - 2 panels side by side */}
              <Panel defaultSize={50} minSize={30}>
                <PanelGroup
                  direction="horizontal"
                  className="flex h-full w-full"
                  autoSaveId="nwsl-top-row"
                >
                  {/* Panel 1 - Left list with tabs */}
                  <Panel minSize={20} defaultSize={33} className="m-2">
                    <DataPanel
                      tabs={panel1Tabs}
                      height="100%"
                      onTabChange={setPanel1ActiveTab}
                    />
                  </Panel>
                  <VerticalResizeHandle />
                  {/* Panel 2 - Center images with tabs */}
                  <Panel minSize={30} defaultSize={67} className="m-2">
                    <ImagePanel
                      tabs={panel2Tabs}
                      height="100%"
                      onTabChange={setPanel2ActiveTab}
                    />
                  </Panel>
                </PanelGroup>
              </Panel>
              <HorizontalResizeHandle />
              {/* Panel 3 - Bottom details with tabs */}
              <Panel defaultSize={50} minSize={30} className="m-2">
                <DataPanel
                  tabs={panel1Tabs}
                  height="100%"
                  onTabChange={setPanel3ActiveTab}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          <VerticalResizeHandle />
          {/* Right Side - ChatKit (full height) */}
          <Panel minSize={20} defaultSize={30} className="m-2">
            <ChatKit control={control} className="h-full w-full rounded-3xl overflow-hidden" />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
