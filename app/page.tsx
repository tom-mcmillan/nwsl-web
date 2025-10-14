'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Typography,
  Divider,
} from '@mui/material';

import { DataPanel } from '@/components/DataPanel';
import { ResearchPanel } from '@/components/ResearchPanel';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useTeamOverview } from '@/hooks/useTeamOverview';
import { useDashboardLookups } from '@/hooks/useDashboardLookups';
import { usePlayerValuation } from '@/hooks/usePlayerValuation';
import { useMomentum } from '@/hooks/useMomentum';
import { usePlayerStyle } from '@/hooks/usePlayerStyle';
import { useShotMap } from '@/hooks/useShotMap';

const competitionOptions = [
  { value: 'regular_season', label: 'Regular Season' },
  { value: 'playoffs', label: 'Playoffs' },
  { value: 'all', label: 'All Competitions' },
] as const;

type CompetitionOption = (typeof competitionOptions)[number]['value'];

type PanelSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

type MetricCardProps = {
  label: string;
  value: string;
};

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

function PanelSection({ title, subtitle, children }: PanelSectionProps) {
  return (
    <Paper elevation={0} square sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>{children}</Box>
    </Paper>
  );
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Paper elevation={0} sx={{ px: 2, py: 1.5, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function LoadingState() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 160 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}

const formatNumber = (value?: number | null, options: Intl.NumberFormatOptions = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', options).format(value);
};

export default function Home() {
  const { data: session } = useSession();
  const isPro = session?.user?.tier === 'PRO';

  const { data: lookups } = useDashboardLookups();

  const [season, setSeason] = useState<number | undefined>();
  const [competition, setCompetition] = useState<CompetitionOption>('regular_season');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | undefined>();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>();

  useEffect(() => {
    if (!season && lookups?.seasons?.length) {
      setSeason(lookups.seasons[0]);
    }
  }, [season, lookups]);

  useEffect(() => {
    if (!matchId && lookups?.matches?.length) {
      setMatchId(lookups.matches[0].matchId);
    }
  }, [matchId, lookups]);

  const currentSeason = useMemo(() => {
    if (season !== undefined) return season;
    if (lookups?.seasons?.length) return lookups.seasons[0];
    return undefined;
  }, [season, lookups]);

  const { data: summaryData, isLoading: summaryLoading } = useDashboardSummary(currentSeason);
  const { data: teamOverviewData, isLoading: teamOverviewLoading } = useTeamOverview({ season: currentSeason, competition });
  const {
    data: playerValuationData,
    isLoading: playerValuationLoading,
  } = usePlayerValuation({ season: currentSeason, competition, teamId, minMinutes: 600, limit: 25, orderBy: 'vaep' });
  const { data: momentumData, isLoading: momentumLoading } = useMomentum(matchId);
  const { data: playerStyleData, isLoading: playerStyleLoading } = usePlayerStyle({ season: currentSeason, competition, playerId: selectedPlayerId });
  const shotMapTeamName = useMemo(() => {
    if (teamId && lookups?.teams) {
      return lookups.teams.find((team) => team.teamId === teamId)?.teamName;
    }
    const firstRow = teamOverviewData?.teamTable.rows?.[0];
    return Array.isArray(firstRow) && typeof firstRow[0] === 'string' ? firstRow[0] : undefined;
  }, [teamId, lookups, teamOverviewData]);
  const { data: shotMapData, isLoading: shotMapLoading } = useShotMap({ teamName: shotMapTeamName, season: currentSeason });

  useEffect(() => {
    if (playerValuationData?.players?.length) {
      const exists = playerValuationData.players.some((player) => player.playerId === selectedPlayerId);
      if (!exists) {
        setSelectedPlayerId(playerValuationData.players[0].playerId);
      }
    } else {
      setSelectedPlayerId(undefined);
    }
  }, [playerValuationData, selectedPlayerId]);

  const teamTableRows = useMemo(() => {
    if (!teamOverviewData) return [];
    const columns = teamOverviewData.teamTable.columns;
    return teamOverviewData.teamTable.rows.map((row, index) => {
      const entry: Record<string, unknown> = { id: `${row[0]}-${index}` };
      columns.forEach((col, idx) => {
        entry[col] = row[idx];
      });
      return entry;
    });
  }, [teamOverviewData]);

  const playerValuationRows = useMemo(() => {
    if (!playerValuationData) return [];
    return playerValuationData.players.map((player, index) => ({
      id: `${player.playerId}-${index}`,
      player: player.playerName,
      team: player.teamName,
      minutes: player.minutes,
      matches: player.matches,
      goals: player.goals,
      assists: player.assists,
      shots: player.shots,
      xt: player.xt,
      vaep_total: player.vaepTotal,
      vaep_offensive: player.vaepOffensive,
      vaep_defensive: player.vaepDefensive,
    }));
  }, [playerValuationData]);

  const momentumEventRows = useMemo(() => {
    if (!momentumData?.events) return [];
    return momentumData.events.map((event, index) => ({
      id: `${event.minute}-${index}`,
      minute: event.minute,
      team: event.team ?? '—',
      player: event.player ?? '—',
      event: event.event,
      detail: event.detail ?? '—',
    }));
  }, [momentumData]);

  const summaryCards = useMemo(() => {
    const headline = summaryData?.headline;
    return [
      { label: 'Matches', value: formatNumber(headline?.matches) },
      { label: 'Players', value: formatNumber(headline?.players) },
      { label: 'Teams', value: formatNumber(headline?.teams) },
      { label: 'Events', value: formatNumber(headline?.events) },
    ];
  }, [summaryData]);

  const leagueAverageCards = useMemo(() => {
    const averages = teamOverviewData?.leagueAverages;
    if (!averages) return [];
    return [
      { label: 'Goals per Match', value: formatNumber(averages.goalsPerMatch, { maximumFractionDigits: 2 }) },
      { label: 'Shots per Match', value: formatNumber(averages.shotsPerMatch, { maximumFractionDigits: 2 }) },
      { label: 'Pass Accuracy %', value: formatNumber(averages.passAccuracyPct, { maximumFractionDigits: 1 }) },
      { label: 'Home Win %', value: formatNumber(averages.homeWinPct, { maximumFractionDigits: 1 }) },
    ];
  }, [teamOverviewData]);

  const shotMapMetricCards = useMemo(() => {
    if (!shotMapData?.metrics) return [];
    const metrics = shotMapData.metrics;
    return [
      metrics.total_shots !== undefined
        ? { label: 'Total Shots', value: formatNumber(metrics.total_shots) }
        : null,
      metrics.goals !== undefined
        ? { label: 'Goals', value: formatNumber(metrics.goals) }
        : null,
      metrics.conversion_rate !== undefined
        ? {
            label: 'Conversion %',
            value: `${formatNumber(metrics.conversion_rate, { maximumFractionDigits: 1 })}%`,
          }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [shotMapData]);

  const competitionLabel = competitionOptions.find((opt) => opt.value === competition)?.label ?? 'Regular Season';

  const chatContext = useMemo(() => ({
    currentView: 'NWSL Dashboard',
    filters: {
      season,
      competition,
      teamId,
    },
    summary: summaryData?.headline ?? null,
    highlights: {
      topTeam: teamOverviewData?.teamTable.rows?.[0]?.[0] ?? null,
      topPlayer: playerValuationData?.players?.[0]?.playerName ?? null,
    },
  }), [season, competition, teamId, summaryData, teamOverviewData, playerValuationData]);

  const researchLinks = [
    { label: 'Natural Language Query: Compare two players', href: '/query' },
    { label: 'SQL Explorer: Team passing accuracy by match', href: '/explore' },
    { label: 'League standings methodology (panel)', href: '/api/panel/league-standings?limit=14' },
    { label: 'Top scorers (panel)', href: '/api/panel/top-scorers?limit=10' },
  ];

  const { control } = useChatKit({
    api: {
      async getClientSecret(currentClientSecret) {
        const pageContext = {
          ...chatContext,
          match: momentumData?.match ?? null,
          timestamp: new Date().toISOString(),
        };

        if (!currentClientSecret) {
          const res = await fetch('/api/chatkit/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: pageContext }),
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

        const res = await fetch('/api/chatkit/refresh', {
          method: 'POST',
          body: JSON.stringify({ currentClientSecret, context: pageContext }),
          headers: { 'Content-Type': 'application/json' },
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
        fontFamily:
          '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        fontFamilyMono:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
        fontSources: [
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
          // ...and 7 more font sources
        ],
      },
    },
    composer: {
      placeholder: 'ask any question... ',
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760,
      },
      tools: [
        {
          id: 'search_docs',
          label: 'Search docs',
          shortLabel: 'Docs',
          placeholderOverride: 'Search documentation',
          icon: 'book-open',
          pinned: false,
        },
      ],
    },
    startScreen: {
      greeting: '',
      prompts: [],
    },
  });

  const handleSeasonChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSeason(value ? Number(value) : undefined);
  };

  const handleCompetitionChange = (event: SelectChangeEvent<CompetitionOption>) => {
    setCompetition(event.target.value as CompetitionOption);
  };

  const handleTeamChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setTeamId(value === 'all' ? null : value);
  };

  const handleMatchChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setMatchId(value || undefined);
  };

  const handlePlayerChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedPlayerId(value || undefined);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-300">
        <div className="flex flex-wrap items-end gap-4 px-4 py-3">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="season-select-label">Season</InputLabel>
            <Select
              labelId="season-select-label"
              value={season?.toString() ?? ''}
              label="Season"
              onChange={handleSeasonChange}
            >
              {(lookups?.seasons ?? []).map((year) => (
                <MenuItem value={year.toString()} key={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="competition-select-label">Competition</InputLabel>
            <Select
              labelId="competition-select-label"
              value={competition}
              label="Competition"
              onChange={handleCompetitionChange}
            >
              {competitionOptions.map((option) => (
                <MenuItem value={option.value} key={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="match-select-label">Match</InputLabel>
            <Select
              labelId="match-select-label"
              value={matchId ?? ''}
              label="Match"
              onChange={handleMatchChange}
            >
              {(lookups?.matches ?? []).map((match) => (
                <MenuItem value={match.matchId} key={match.matchId}>
                  {match.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="bg-white border-b border-gray-300">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, px: 4, py: 2 }}>
          {summaryLoading ? <LoadingState /> : summaryCards.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </Box>
      </div>

      <div className="flex-1 overflow-hidden p-2">
        <PanelGroup direction="horizontal" className="flex h-full" autoSaveId="nwsl-dashboard-layout">
          <Panel minSize={45} defaultSize={70}>
            <PanelGroup direction="vertical" className="flex h-full w-full" autoSaveId="nwsl-dashboard-left">
              <Panel defaultSize={60} minSize={35}>
                <PanelSection title="Team Overview" subtitle={`${competitionLabel}${season ? ` • ${season}` : ''}`}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel id="team-select-label">Team</InputLabel>
                      <Select
                        labelId="team-select-label"
                        value={teamId ?? 'all'}
                        label="Team"
                        onChange={handleTeamChange}
                      >
                        <MenuItem value="all">All Teams</MenuItem>
                        {(lookups?.teams ?? []).map((team) => (
                          <MenuItem value={team.teamId} key={team.teamId}>
                            {team.teamName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {teamOverviewLoading ? (
                    <LoadingState />
                  ) : teamTableRows.length ? (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 2 }}>
                        {leagueAverageCards.map((metric) => (
                          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                        ))}
                      </Box>
                      {shotMapTeamName ? (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                          <Paper
                            variant="outlined"
                            sx={{ flex: 1, minWidth: 320, position: 'relative', minHeight: 260, overflow: 'hidden' }}
                          >
                            {shotMapLoading ? (
                              <LoadingState />
                            ) : shotMapData ? (
                              <Image
                                src={shotMapData.imageUrl}
                                alt={shotMapData.summary || `${shotMapTeamName} shot map`}
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            ) : (
                              <EmptyState message="Shot map unavailable." />
                            )}
                          </Paper>
                          {shotMapMetricCards.length ? (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, minWidth: 160 }}>
                              {shotMapMetricCards.map((metric) => (
                                <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                              ))}
                            </Box>
                          ) : null}
                        </Box>
                      ) : null}
                      <DataPanel heading="Team" data={teamTableRows} height="100%" searchable />
                    </>
                  ) : (
                    <EmptyState message="No team data available for the selected filters." />
                  )}
                </PanelSection>
              </Panel>
              <HorizontalResizeHandle />
              <Panel defaultSize={35} minSize={30}>
                <PanelSection title="Team Tactical Analysis" subtitle={shotMapTeamName ? `${shotMapTeamName} • ${competitionLabel}` : competitionLabel}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Paper
                      variant="outlined"
                      sx={{ flex: 1, minWidth: 320, position: 'relative', minHeight: 320, overflow: 'hidden' }}
                    >
                      <Image
                        src="/images/team-tactical-analysis.png"
                        alt={shotMapTeamName ? `${shotMapTeamName} tactical analysis` : 'Team tactical analysis overview'}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </Paper>
                    <Box sx={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Pressing & Possession Highlights
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Heat map focuses on high press recoveries and wide overloads, while the trend chart tracks
                        possession swings across 15-minute windows. Use the filters above to swap teams or seasons.
                      </Typography>
                      <Divider />
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1 }}>
                        <MetricCard label="High Press Regains" value="+8% vs league" />
                        <MetricCard label="Final-Third Entries" value="18 / match" />
                        <MetricCard label="Average Possession" value="56%" />
                        <MetricCard label="Switches of Play" value="12 / match" />
                      </Box>
                    </Box>
                  </Box>
                </PanelSection>
              </Panel>
              <HorizontalResizeHandle />
              <Panel defaultSize={40} minSize={35}>
                <PanelSection title="Match Momentum" subtitle={momentumData?.match ? `${momentumData.match.homeTeam} vs ${momentumData.match.awayTeam}` : undefined}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Rolling xG window: 5 minutes
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {momentumData?.match ? `${formatNumber(momentumData.match.homeScore)} - ${formatNumber(momentumData.match.awayScore)}` : ''}
                    </Typography>
                  </Box>
                  {momentumLoading ? (
                    <LoadingState />
                  ) : momentumEventRows.length ? (
                    <DataPanel heading="Key Events" data={momentumEventRows} height="100%" searchable />
                  ) : (
                    <EmptyState message="No event data available for the selected match." />
                  )}
                </PanelSection>
              </Panel>
            </PanelGroup>
          </Panel>
          <VerticalResizeHandle />
          <Panel minSize={25} defaultSize={40}>
            <PanelGroup direction="vertical" className="flex h-full w-full" autoSaveId="nwsl-dashboard-middle">
              <Panel defaultSize={60} minSize={35}>
                <PanelSection title="Player Valuation & Advanced Metrics" subtitle={teamId ? `Filtered: ${lookups?.teams.find((team) => team.teamId === teamId)?.teamName ?? teamId}` : 'All Teams'}>
                  {playerValuationLoading ? (
                    <LoadingState />
                  ) : playerValuationRows.length ? (
                    <>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <MetricCard
                          label="Top xG"
                          value={playerValuationData?.headline.topXg?.playerName
                            ? `${playerValuationData.headline.topXg.playerName} • ${formatNumber(playerValuationData.headline.topXg.value, { maximumFractionDigits: 2 })}`
                            : '—'}
                        />
                        <MetricCard
                          label="Top xT"
                          value={playerValuationData?.headline.topXt?.playerName
                            ? `${playerValuationData.headline.topXt.playerName} • ${formatNumber(playerValuationData.headline.topXt.value, { maximumFractionDigits: 2 })}`
                            : '—'}
                        />
                        <MetricCard
                          label="Median VAEP"
                          value={formatNumber(playerValuationData?.headline.medianVaep, { maximumFractionDigits: 2 })}
                        />
                      </Box>
                      <DataPanel heading="Players" data={playerValuationRows} height="100%" searchable />
                    </>
                  ) : (
                    <EmptyState message="No player valuation data available for the selected filters." />
                  )}
                </PanelSection>
              </Panel>
              <HorizontalResizeHandle />
              <Panel defaultSize={40} minSize={35}>
                <PanelSection title="Research & Links">
                  <ResearchPanel heading="Research" links={researchLinks} height="100%" />
                </PanelSection>
              </Panel>
            </PanelGroup>
          </Panel>
          <VerticalResizeHandle />
          <Panel minSize={25} defaultSize={35}>
            <PanelGroup direction="vertical" className="flex h-full w-full" autoSaveId="nwsl-dashboard-right">
              <Panel defaultSize={45} minSize={35}>
                <PanelSection title="Player Style & Role">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="player-select-label">Player</InputLabel>
                        <Select
                          labelId="player-select-label"
                          value={selectedPlayerId ?? ''}
                          label="Player"
                          onChange={handlePlayerChange}
                          disabled={!playerValuationData?.players?.length}
                        >
                          {(playerValuationData?.players ?? []).map((player) => (
                            <MenuItem value={player.playerId} key={player.playerId}>
                              {player.playerName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Paper variant="outlined" sx={{ flex: 1, minWidth: 320, position: 'relative', minHeight: 320 }}>
                        <Image
                          src="/images/player-style.png"
                          alt={selectedPlayerId ? `Player style report` : 'Player style overview'}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </Paper>
                      <Box sx={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {playerStyleLoading ? (
                          <LoadingState />
                        ) : playerStyleData ? (
                          <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Style Breakdown
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1 }}>
                              {playerStyleData.radar.metrics.map((metric) => (
                                <MetricCard
                                  key={metric.label}
                                  label={metric.label}
                                  value={`${formatNumber(metric.value, { maximumFractionDigits: 2 })} • ${formatNumber(metric.percentile, { maximumFractionDigits: 1 })} pct.`}
                                />
                              ))}
                            </Box>
                            <Divider />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Top Tendencies
                            </Typography>
                            {playerStyleData.stylePrototypes.length ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {playerStyleData.stylePrototypes.map((prototype) => (
                                  <Paper key={prototype.prototypeId} variant="outlined" sx={{ p: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {prototype.actionType} • Prototype {prototype.prototypeId}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Share {formatNumber(prototype.share * 100, { maximumFractionDigits: 1 })}% • Weight {formatNumber(prototype.weight, { maximumFractionDigits: 2 })}
                                    </Typography>
                                  </Paper>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No style components available.
                              </Typography>
                            )}
                          </>
                        ) : (
                          <EmptyState message="Select a player to view style metrics." />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </PanelSection>
              </Panel>
            </PanelGroup>
          </Panel>
          <VerticalResizeHandle />
          <Panel minSize={18} defaultSize={28}>
            <div className="h-full w-full bg-white">
              {isPro ? (
                <ChatKit control={control} className="h-full w-full" />
              ) : (
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Chat Assistant
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    NWSL Pro access unlocks the ChatKit assistant for deeper analysis.
                  </Typography>
                </Box>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
