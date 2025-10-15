'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { ChatKitOptions } from '@openai/chatkit';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

import { DataPanel } from '@/components/DataPanel';
import { ResearchPanel } from '@/components/ResearchPanel';
import { useTeamOverview } from '@/hooks/useTeamOverview';
import { useDashboardLookups } from '@/hooks/useDashboardLookups';
import { usePlayerValuation } from '@/hooks/usePlayerValuation';
import { useMomentum } from '@/hooks/useMomentum';
import { usePlayerStyle } from '@/hooks/usePlayerStyle';
import type { MomentumResponse } from '@/lib/server/apiClient';
import { WIREFRAME_MODE } from '@/lib/ui';

const competitionOptions = [
  { value: 'regular_season', label: 'Regular Season' },
  { value: 'playoffs', label: 'Playoffs' },
  { value: 'all', label: 'All Competitions' },
] as const;
const defaultCompetition = competitionOptions[0].value;

type CompetitionOption = (typeof competitionOptions)[number]['value'];

type PanelSectionProps = {
  title: string;
  children?: React.ReactNode;
  disableWireframe?: boolean;
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

function PanelSection({ title, children, disableWireframe }: PanelSectionProps) {
  const showPlaceholder = WIREFRAME_MODE && !disableWireframe;
  return (
    <Paper elevation={0} square className="dashboard-panel">
      <Box className="dashboard-panel__header">
        <span>{title}</span>
      </Box>
      <Box className="dashboard-panel__body">
        {showPlaceholder ? <div className="wireframe-placeholder" /> : children}
      </Box>
    </Paper>
  );
}

type ChatPanelProps = {
  context: Record<string, unknown>;
  momentum: MomentumResponse | undefined;
};

const chatKitOptions: ChatKitOptions = {
  api: {
    // TODO: configure your ChatKit API integration (URL, auth, uploads).
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
      maxSize: 10_485_760,
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
};

function ChatPanel({ context, momentum }: ChatPanelProps) {
  if (WIREFRAME_MODE) {
    return <div className="wireframe-placeholder" />;
  }

  return <ChatKitClient context={context} momentum={momentum} />;
}

function ChatKitClient({ context, momentum }: ChatPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const sessionContext = useMemo(
    () => ({
      ...context,
      match: momentum?.match ?? null,
    }),
    [context, momentum?.match]
  );

  const { control } = useChatKit({
    options: chatKitOptions,
    api: {
      async getClientSecret(currentClientSecret) {
        const payload = {
          context: {
            ...sessionContext,
            timestamp: new Date().toISOString(),
          },
        };

        try {
          if (!currentClientSecret) {
            const res = await fetch('/api/chatkit/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || !data?.client_secret) {
              throw new Error(data?.error || 'Missing client secret');
            }
            return data.client_secret as string;
          }

          const res = await fetch('/api/chatkit/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentClientSecret, context: payload.context }),
          });
          const data = await res.json();
          if (!res.ok || !data?.client_secret) {
            throw new Error(data?.error || 'Missing client secret');
          }
          return data.client_secret as string;
        } catch (err) {
          console.error('ChatKit session error', err);
          setError('Chat assistant is currently unavailable.');
          throw err;
        }
      },
    },
  });

  if (error) {
    return (
      <div className="chatkit-error">
        <p>{error}</p>
      </div>
    );
  }

  return <ChatKit control={control} options={chatKitOptions} className="chatkit-client" />;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: '#fdfdfd',
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function LoadingState() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 140 }}>
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

type StandingsRow = {
  team: string;
  teamId?: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  pointsPerGame: number | null;
  shotAccuracy: number | null;
  passAccuracy: number | null;
};

function LeagueStandingsTable({
  rows,
  loading,
  selectedTeamId,
  onSelectTeam,
}: {
  rows: StandingsRow[];
  loading: boolean;
  selectedTeamId: string | null;
  onSelectTeam?: (teamId: string | null) => void;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (!rows.length) {
    return <EmptyState message="Standings unavailable for the selected filters." />;
  }

  const maxPpg = rows.reduce((max, r) => Math.max(max, r.pointsPerGame ?? 0), 0);

  return (
    <TableContainer
      sx={{
        maxHeight: 420,
        border: '1px solid #d7dbe3',
        borderRadius: 1,
        boxShadow: '0 1px 0 rgba(15,23,42,0.08)',
        backgroundColor: '#fff',
      }}
    >
      <Table
        stickyHeader
        size="small"
        aria-label="League standings"
        sx={{
          '& .MuiTableRow-root': { height: 32 },
          '& thead th': {
            fontSize: '0.68rem',
            fontWeight: 600,
            color: '#4b5563',
            letterSpacing: 0.2,
            borderBottom: '1px solid #d7dbe3',
            backgroundColor: '#f8f9fb',
          },
          '& tbody td': {
            fontSize: '0.7rem',
            borderBottom: '1px solid #edf0f5',
            color: '#1f2937',
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Team</TableCell>
            <TableCell align="right">MP</TableCell>
            <TableCell align="right">PTS</TableCell>
            <TableCell align="right">GD</TableCell>
            <TableCell align="right">PPG</TableCell>
            <TableCell align="right">Shot%</TableCell>
            <TableCell align="right">Pass%</TableCell>
            <TableCell align="right">Record</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const isSelected = Boolean(row.teamId && row.teamId === selectedTeamId);
            const ppgPercent = maxPpg > 0 && row.pointsPerGame ? Math.min(row.pointsPerGame / maxPpg, 1) : 0;
            const bandColor = index < 4 ? '#2451b2' : index >= rows.length - 2 ? '#dc2626' : 'transparent';

            return (
              <TableRow
                key={row.team}
                hover
                onClick={onSelectTeam ? () => onSelectTeam(row.teamId ?? null) : undefined}
                sx={{
                  cursor: onSelectTeam ? 'pointer' : 'default',
                  backgroundColor: isSelected ? 'rgba(36,81,178,0.12)' : index % 2 ? '#f5f6f8' : '#fff',
                  borderLeft: `2px solid ${bandColor}` ,
                }}
              >
                <TableCell sx={{ fontWeight: 600 }}>{row.team}</TableCell>
                <TableCell align="right" sx={{ color: '#4b5563' }}>{formatNumber(row.matches)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatNumber(row.points)}</TableCell>
                <TableCell align="right" sx={{ color: row.goalDiff >= 0 ? '#2563eb' : '#dc2626' }}>{formatNumber(row.goalDiff)}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Box sx={{ width: 48, height: 4, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                      <Box sx={{ width: `${ppgPercent * 100}%`, height: '100%', backgroundColor: '#2563eb' }} />
                    </Box>
                    <Typography component="span" sx={{ fontWeight: 600 }}>{row.pointsPerGame === null ? '—' : formatNumber(row.pointsPerGame, { maximumFractionDigits: 2 })}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {row.shotAccuracy === null ? '—' : `${formatNumber(row.shotAccuracy, { maximumFractionDigits: 1 })}%`}
                </TableCell>
                <TableCell align="right">
                  {row.passAccuracy === null ? '—' : `${formatNumber(row.passAccuracy, { maximumFractionDigits: 1 })}%`}
                </TableCell>
                <TableCell align="right" sx={{ color: '#6b7280' }}>
                  {row.wins}-{row.draws}-{row.losses}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const formatNumber = (value?: number | null, options: Intl.NumberFormatOptions = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', options).format(value);
};

export default function Home() {

  const { data: lookups } = useDashboardLookups();

  const [season, setSeason] = useState<number | undefined>();
  const competition: CompetitionOption = defaultCompetition;
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

  const { data: teamOverviewData, isLoading: teamOverviewLoading } = useTeamOverview({ season: currentSeason, competition });
  const {
    data: playerValuationData,
    isLoading: playerValuationLoading,
  } = usePlayerValuation({ season: currentSeason, competition, teamId, minMinutes: 600, limit: 25, orderBy: 'vaep' });
  const { data: momentumData, isLoading: momentumLoading } = useMomentum(matchId);
  const { data: playerStyleData, isLoading: playerStyleLoading } = usePlayerStyle({ season: currentSeason, competition, playerId: selectedPlayerId });
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


  const standingsRows = useMemo<StandingsRow[]>(() => {
    const table = teamOverviewData?.teamTable;
    if (!table?.rows?.length) return [];
    const lookupTeams = lookups?.teams ?? [];

    return table.rows
      .map((row) => {
        const [teamName, mp, w, d, l, gf, ga, gd, ppg, shotAcc, passAcc] = row as (
          | string
          | number
          | null
        )[];

        const wins = Number(w ?? 0);
        const draws = Number(d ?? 0);
        const losses = Number(l ?? 0);
        const matches = Number(mp ?? wins + draws + losses);
        const goalsFor = Number(gf ?? 0);
        const goalsAgainst = Number(ga ?? 0);
        const goalDiff = Number(gd ?? goalsFor - goalsAgainst);
        const points = wins * 3 + draws;
        const pointsPerGame = typeof ppg === 'number' ? ppg : matches > 0 ? points / matches : null;
        const shotAccuracy = typeof shotAcc === 'number' ? shotAcc : null;
        const passAccuracy = typeof passAcc === 'number' ? passAcc : null;

        const teamMeta = lookupTeams.find((team) => team.teamName === teamName);
        const teamId = teamMeta?.teamId ?? null;
        const shortLabel = teamMeta?.shortName ?? teamMeta?.teamName ?? teamName;

        return {
          team: String(shortLabel ?? 'Unknown'),
          teamId,
          matches,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDiff,
          points,
          pointsPerGame,
          shotAccuracy,
          passAccuracy,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      });
  }, [teamOverviewData?.teamTable, lookups?.teams]);


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


  const chatContext = useMemo(
    () => ({
      currentView: 'NWSL Dashboard',
      filters: {
        season,
        competition,
        teamId,
      },
      summary: null,
      highlights: {
        topTeam: teamOverviewData?.teamTable.rows?.[0]?.[0] ?? null,
        topPlayer: playerValuationData?.players?.[0]?.playerName ?? null,
      },
    }),
    [season, competition, teamId, teamOverviewData?.teamTable, playerValuationData?.players]
  );

  const researchLinks = [
    { label: 'Natural Language Query: Compare two players', href: '/query' },
    { label: 'SQL Explorer: Team passing accuracy by match', href: '/explore' },
    { label: 'League standings methodology (panel)', href: '/api/panel/league-standings?limit=14' },
    { label: 'Top scorers (panel)', href: '/api/panel/top-scorers?limit=10' },
  ];

  const handlePlayerChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedPlayerId(value || undefined);
  };

  const analyticsPanels = (
    <>
      <Panel minSize={45} defaultSize={70}>
        <PanelGroup direction="vertical" className="flex h-full w-full" autoSaveId="nwsl-dashboard-left">
          <Panel defaultSize={60} minSize={35}>
            <PanelSection title="League Standings">
              {teamOverviewLoading ? (
                <LoadingState />
              ) : standingsRows.length ? (
                <LeagueStandingsTable
                  rows={standingsRows}
                  loading={teamOverviewLoading}
                  selectedTeamId={teamId}
                  onSelectTeam={(id) => setTeamId(id)}
                />
              ) : (
                <EmptyState message="No team overview data available for the selected filters." />
              )}
            </PanelSection>
          </Panel>
          <HorizontalResizeHandle />
          <Panel defaultSize={40} minSize={35}>
            <PanelSection title="Momentum & Match Flow">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
            <PanelSection title="Player Valuation & Advanced Metrics">
              {playerValuationLoading ? (
                <LoadingState />
              ) : playerValuationRows.length ? (
                <>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
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
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Paper variant="outlined" sx={{ flex: 1, minWidth: 260, position: 'relative', minHeight: 240 }}>
                    <Image
                      src="/images/player-style.png"
                      alt={selectedPlayerId ? `Player style report` : 'Player style overview'}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </Paper>
                  <Box sx={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {playerStyleLoading ? (
                      <LoadingState />
                    ) : playerStyleData ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Style Breakdown
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 }}>
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
                              <Paper key={prototype.prototypeId} variant="outlined" sx={{ p: 1.25 }}>
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
          <HorizontalResizeHandle />
          <Panel defaultSize={55} minSize={35}>
            <PanelSection title="Value Flow Spotlight">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Coming soon: Sankey visuals for team-to-player VAEP contributions.
                </Typography>
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Request this data via ChatKit for the latest exports.
                </Typography>
              </Box>
            </PanelSection>
          </Panel>
        </PanelGroup>
      </Panel>
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 overflow-hidden p-2">
        <PanelGroup direction="horizontal" className="flex h-full" autoSaveId="nwsl-dashboard-root">
          {analyticsPanels}
          <VerticalResizeHandle />
          <Panel minSize={20} defaultSize={28}>
            <div className="chatkit-column">
              <ChatPanel context={chatContext} momentum={momentumData} />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
