const Dashboard = (() => {
  const state = {
    radarChart: null,
    valueFlowVisible: true,
    gkMetric: 'psxg',
  };

  async function init() {
    initializeLayout();
    hydrateStaticControls();
    bindGlobalEvents();
    setupChatPlaceholder();

    await Promise.all([
      loadHeadlineMetrics(),
      loadTeamOverview(),
      loadPlayerValuation(),
      loadTacticalAnalysis(),
      loadGoalkeeperPanel(),
      loadMomentumPanel(),
      loadPlayerStylePanel(),
    ]);
  }

  /* ---------- Layout & Interactivity ---------- */

  function initializeLayout() {
    if (window.GridStack) {
      GridStack.init({
        cellHeight: 80,
        float: true,
        animate: true,
      }, '#dashboard-grid');
    } else {
      console.info(
        '[placeholder] GridStack.js not available. Panels remain on CSS grid with native resize handles.'
      );
    }
  }

  function bindGlobalEvents() {
    document.body.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const action = target.dataset.action;
      switch (action) {
        case 'export-team-overview':
          event.preventDefault();
          exportTableToCSV('team-overview-table', 'team-overview.csv');
          break;
        case 'toggle-value-flow':
          event.preventDefault();
          toggleValueFlow();
          break;
        case 'toggle-gk-metric':
          event.preventDefault();
          cycleGoalkeeperMetric();
          break;
        case 'play-momentum':
          event.preventDefault();
          simulateMomentumPlayback();
          break;
        case 'randomize-style':
          event.preventDefault();
          loadPlayerStylePanel();
          break;
        case 'toggle-chat':
          event.preventDefault();
          toggleChatPanel();
          break;
        default:
          break;
      }
    });

    const chatForm = document.getElementById('chat-form');
    chatForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('chat-message');
      if (!input || !input.value.trim()) return;
      appendChatMessage('user', input.value.trim());
      input.value = '';
      window.setTimeout(() => {
        appendChatMessage(
          'assistant',
          'Placeholder reply. Replace with OpenAI ChatKit session integration.'
        );
      }, 400);
    });
  }

  function hydrateStaticControls() {
    // Placeholder team list. Replace with real metadata query.
    const teams = [
      'All Teams',
      'Orlando Pride',
      'Washington Spirit',
      'Kansas City Current',
      'Gotham FC',
      'San Diego Wave',
      'Portland Thorns',
      'North Carolina Courage',
    ];

    fillSelect('player-team-filter', teams);
    fillSelect('tactics-team-filter', teams);
    fillSelect('goalkeeper-team-filter', teams);
    fillSelect('momentum-match-filter', [
      'ORL vs SDW — 2024-08-24',
      'WAS vs POR — 2024-08-17',
      'GOT vs KCC — 2024-09-01',
    ]);
    fillSelect('player-style-filter', [
      'Sophia Smith',
      'Trinity Rodman',
      'Debinha',
      'Alex Morgan',
    ]);
  }

  function fillSelect(id, options) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    options.forEach((label, index) => {
      const opt = document.createElement('option');
      opt.value = label;
      opt.textContent = label;
      if (index === 0) opt.selected = true;
      select.appendChild(opt);
    });
  }

  /* ---------- Headline Metrics ---------- */

  async function loadHeadlineMetrics() {
    const metrics = await fetchHeadlineMetrics();
    setText('headline-matches', formatNumber(metrics.matches));
    setText('headline-players', formatNumber(metrics.players));
    setText('headline-teams', formatNumber(metrics.teams));
    setText('headline-events', metrics.events.toLocaleString());
  }

  async function fetchHeadlineMetrics() {
    // TODO: Replace with backend API call.
    console.info('[placeholder] fetchHeadlineMetrics');
    return {
      matches: 1327,
      players: 903,
      teams: 14,
      events: 2400000,
    };
  }

  /* ---------- Panel 1: Team Overview ---------- */

  async function loadTeamOverview() {
    const season =
      /** @type {HTMLSelectElement} */ (
        document.getElementById('team-overview-season')
      )?.value ?? '2024';

    const raw = await fetchTeamOverviewData({ season });
    const processed = processTeamOverviewData(raw);
    renderTeamOverviewKpis(processed);
    renderTeamOverviewTable(processed.tableRows);
    renderTeamOverviewChart(processed.chartSeries);
  }

  async function fetchTeamOverviewData(filters) {
    // TODO: Replace with call to /panel or bespoke API.
    console.info('[placeholder] fetchTeamOverviewData', filters);
    const teams = [
      'Orlando Pride',
      'Washington Spirit',
      'Kansas City Current',
      'Gotham FC',
      'San Diego Wave',
      'Portland Thorns',
      'North Carolina Courage',
    ];

    return teams.map((team) => {
      const matches = randomInt(18, 22);
      const wins = randomInt(8, 14);
      const draws = randomInt(2, 6);
      const losses = Math.max(matches - wins - draws, 0);
      const gf = randomInt(25, 45);
      const ga = randomInt(18, 34);
      const shotAcc = randomFloat(55, 68, 1);
      const passAcc = randomFloat(72, 84, 1);
      return {
        team,
        matches,
        wins,
        draws,
        losses,
        gf,
        ga,
        shotAcc,
        passAcc,
      };
    });
  }

  function processTeamOverviewData(rows) {
    if (!Array.isArray(rows)) return { tableRows: [], chartSeries: [] };
    const chartSeries = rows.map((row) => ({
      team: row.team,
      pointsPerGame: Number(((row.wins * 3 + row.draws) / row.matches).toFixed(2)),
      goalsFor: row.gf,
      goalsAgainst: row.ga,
    }));

    const leagueAvgGoals =
      rows.reduce((acc, row) => acc + row.gf, 0) / rows.length || 0;
    const leagueAvgShots = randomFloat(11, 16, 1);
    const avgPass =
      rows.reduce((acc, row) => acc + row.passAcc, 0) / rows.length || 0;
    const homeWin = randomFloat(58, 66, 1);

    return {
      tableRows: rows.map((row) => ({
        Team: row.team,
        MP: row.matches,
        W: row.wins,
        D: row.draws,
        L: row.losses,
        GF: row.gf,
        GA: row.ga,
        GD: row.gf - row.ga,
        PPG: Number(((row.wins * 3 + row.draws) / row.matches).toFixed(2)),
        'Shot Acc%': row.shotAcc,
        'Pass Acc%': row.passAcc,
      })),
      chartSeries,
      leagueStats: {
        leagueAvgGoals,
        leagueAvgShots,
        avgPass,
        homeWin,
      },
    };
  }

  function renderTeamOverviewKpis({ leagueStats }) {
    if (!leagueStats) return;
    setText('kpi-league-goals', leagueStats.leagueAvgGoals.toFixed(1));
    setText('kpi-league-shots', leagueStats.leagueAvgShots.toFixed(1));
    setText('kpi-pass-acc', `${leagueStats.avgPass.toFixed(1)}%`);
    setText('kpi-home-win', `${leagueStats.homeWin.toFixed(1)}%`);
  }

  function renderTeamOverviewTable(rows) {
    renderTable('team-overview-table', rows);
  }

  function renderTeamOverviewChart(series) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for team overview chart.');
      return;
    }
    const trace = {
      x: series.map((s) => s.team),
      y: series.map((s) => s.pointsPerGame),
      type: 'bar',
      marker: {
        color: '#0b69ff',
      },
      name: 'Points per game',
    };

    const layout = {
      autosize: true,
      margin: { l: 40, r: 10, t: 20, b: 60 },
      yaxis: { title: 'Points per game', gridcolor: '#edf0f4' },
      xaxis: { tickangle: -35 },
    };

    Plotly.react('chart-team-bars', [trace], layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  /* ---------- Panel 2: Player Valuation ---------- */

  async function loadPlayerValuation() {
    const teamSelect = /** @type {HTMLSelectElement} */ (
      document.getElementById('player-team-filter')
    );
    const team = teamSelect?.value ?? 'All Teams';
    const raw = await fetchPlayerValuationData({ team });
    const processed = processPlayerValuation(raw);
    renderTable('player-valuation-table', processed.tableRows);
    renderPlayerValuationKpis(processed);
    renderValueFlowMap(processed.valueFlow);
  }

  async function fetchPlayerValuationData(filters) {
    // TODO: Replace with backend query (e.g., /api/query for VAEP/xT).
    console.info('[placeholder] fetchPlayerValuationData', filters);
    const samplePlayers = [
      ['Trinity Rodman', 'Washington Spirit', 'FW'],
      ['Sophia Smith', 'Portland Thorns', 'FW'],
      ['Alex Morgan', 'San Diego Wave', 'FW'],
      ['Debinha', 'Kansas City Current', 'MF'],
      ['Lindsey Horan', 'Portland Thorns', 'MF'],
      ['Rose Lavelle', 'Gotham FC', 'MF'],
      ['Mallory Swanson', 'Chicago Red Stars', 'FW'],
      ['Esther González', 'Gotham FC', 'FW'],
    ];

    return samplePlayers.map(([player, team, pos]) => {
      const minutes = randomInt(780, 1900);
      return {
        player,
        team,
        pos,
        minutes,
        xg: randomFloat(2.5, 9.8, 1),
        goals: randomInt(2, 12),
        xa: randomFloat(1.4, 6.6, 1),
        assists: randomInt(1, 9),
        xt: randomFloat(0.8, 5.8, 2),
        vaep: randomFloat(1.8, 8.8, 2),
      };
    });
  }

  function processPlayerValuation(rows) {
    const tableRows = rows.map((row) => ({
      Player: row.player,
      Team: row.team,
      Pos: row.pos,
      Min: row.minutes,
      xG: row.xg,
      G: row.goals,
      xA: row.xa,
      A: row.assists,
      xT: row.xt,
      VAEP: row.vaep,
    }));

    const topXg = [...rows].sort((a, b) => b.xg - a.xg)[0];
    const topXt = [...rows].sort((a, b) => b.xt - a.xt)[0];
    const medianVaep =
      rows.map((row) => row.vaep).sort((a, b) => a - b)[Math.floor(rows.length / 2)];

    const valueFlow = {
      nodes: [...new Set(rows.map((row) => row.team))],
      links: rows.slice(0, 5).map((row) => ({
        source: row.team,
        target: row.player,
        value: Number(row.xt.toFixed(2)),
      })),
    };

    return {
      tableRows,
      topXg,
      topXt,
      medianVaep,
      valueFlow,
    };
  }

  function renderPlayerValuationKpis(data) {
    const teamSelect = /** @type {HTMLSelectElement} */ (
      document.getElementById('player-team-filter')
    );

    setText('kpi-selected-team', teamSelect?.value ?? 'All Teams');
    setText('kpi-top-xg', data.topXg ? `${data.topXg.player} (${data.topXg.xg})` : '—');
    setText('kpi-top-xt', data.topXt ? `${data.topXt.player} (${data.topXt.xt})` : '—');
    setText('kpi-median-vaep', data.medianVaep?.toFixed(2) ?? '—');
  }

  function renderValueFlowMap(flow) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for value flow map.');
      return;
    }

    const nodeLabels = [...new Set([...flow.nodes, ...flow.links.map((l) => l.target)])];
    const nodeIndex = new Map(nodeLabels.map((label, idx) => [label, idx]));

    const data = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          label: nodeLabels,
          color: nodeLabels.map((label) =>
            flow.nodes.includes(label) ? '#2563eb' : '#0ea5e9'
          ),
          pad: 15,
        },
        link: {
          source: flow.links.map((link) => nodeIndex.get(link.source)),
          target: flow.links.map((link) => nodeIndex.get(link.target)),
          value: flow.links.map((link) => link.value),
          color: '#a5c9ff',
        },
      },
    ];

    const layout = {
      margin: { l: 10, r: 10, t: 10, b: 10 },
    };

    Plotly.react('chart-value-flow', data, layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  function toggleValueFlow() {
    state.valueFlowVisible = !state.valueFlowVisible;
    const chart = document.getElementById('chart-value-flow');
    if (chart) {
      chart.style.display = state.valueFlowVisible ? 'block' : 'none';
    }
  }

  /* ---------- Panel 3: Tactical Analysis ---------- */

  async function loadTacticalAnalysis() {
    const teamSelect = /** @type {HTMLSelectElement} */ (
      document.getElementById('tactics-team-filter')
    );
    const eventSelect = /** @type {HTMLSelectElement} */ (
      document.getElementById('tactics-event-filter')
    );

    const data = await fetchTacticalData({
      team: teamSelect?.value ?? 'All Teams',
      event: eventSelect?.value ?? 'passes',
    });

    renderEventHeatmap(data.heatmap);
    renderPlayerDistribution(data.distribution);
  }

  async function fetchTacticalData(filters) {
    // TODO: Replace with spatial event query.
    console.info('[placeholder] fetchTacticalData', filters);
    const coordinates = Array.from({ length: 250 }, () => ({
      x: randomFloat(0, 105, 2),
      y: randomFloat(0, 68, 2),
      intensity: randomFloat(0.1, 1.0, 2),
    }));

    return {
      heatmap: coordinates,
      distribution: coordinates.slice(0, 80),
    };
  }

  function renderEventHeatmap(events) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for event heatmap.');
      return;
    }

    const trace = {
      x: events.map((ev) => ev.x),
      y: events.map((ev) => ev.y),
      z: events.map((ev) => ev.intensity),
      type: 'histogram2d',
      colorscale: 'Blues',
      showscale: false,
    };

    const layout = {
      margin: { l: 30, r: 10, t: 10, b: 30 },
      xaxis: { title: 'Pitch X', range: [0, 105] },
      yaxis: { title: 'Pitch Y', range: [0, 68] },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
    };

    Plotly.react('chart-event-heatmap', [trace], layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  function renderPlayerDistribution(distribution) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for distribution scatter.');
      return;
    }

    const trace = {
      x: distribution.map((point) => point.x),
      y: distribution.map((point) => point.y),
      mode: 'markers',
      type: 'scatter',
      marker: {
        color: distribution.map((point) => point.intensity),
        colorscale: 'Viridis',
        size: 8,
        opacity: 0.7,
      },
    };

    const layout = {
      margin: { l: 30, r: 10, t: 10, b: 30 },
      xaxis: { title: 'Pitch X', range: [0, 105] },
      yaxis: { title: 'Pitch Y', range: [0, 68] },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
    };

    Plotly.react('chart-player-distribution', [trace], layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  /* ---------- Panel 4: Goalkeepers ---------- */

  async function loadGoalkeeperPanel() {
    const team = /** @type {HTMLSelectElement} */ (
      document.getElementById('goalkeeper-team-filter')
    )?.value;

    const data = await fetchGoalkeeperData({ team, metric: state.gkMetric });
    renderTable('goalkeeper-table', data.tableRows);
    renderGoalkeeperKpis(data);
    renderGoalkeeperChart(data);
  }

  async function fetchGoalkeeperData(filters) {
    // TODO: Replace with aggregated goalkeeper query.
    console.info('[placeholder] fetchGoalkeeperData', filters);
    const keepers = [
      ['Alyssa Naeher', 'Chicago Red Stars'],
      ['Adrianna Franch', 'Kansas City Current'],
      ['Kailen Sheridan', 'San Diego Wave'],
      ['Casey Murphy', 'North Carolina Courage'],
    ];

    const rows = keepers.map(([keeper, team]) => {
      const matches = randomInt(12, 20);
      const saves = randomInt(45, 76);
      const conceded = randomInt(18, 35);
      const savePct = randomFloat(70, 84, 1);
      const cleanSheets = randomInt(5, 10);
      const distAcc = randomFloat(65, 82, 1);
      const psxg = randomFloat(0.5, 3.5, 2);
      return {
        keeper,
        team,
        matches,
        saves,
        conceded,
        savePct,
        cleanSheets,
        distAcc,
        psxg,
      };
    });

    return {
      tableRows: rows.map((row) => ({
        Goalkeeper: row.keeper,
        Team: row.team,
        Matches: row.matches,
        Saves: row.saves,
        GoalsConceded: row.conceded,
        'Save%': row.savePct,
        CleanSheets: row.cleanSheets,
        'Dist Acc%': row.distAcc,
      })),
      rows,
    };
  }

  function renderGoalkeeperKpis(data) {
    const bestSave = [...data.rows].sort((a, b) => b.savePct - a.savePct)[0];
    const mostClean = [...data.rows].sort((a, b) => b.cleanSheets - a.cleanSheets)[0];
    const bestDist = [...data.rows].sort((a, b) => b.distAcc - a.distAcc)[0];

    setText('kpi-best-save', bestSave ? `${bestSave.keeper} (${bestSave.savePct}%)` : '—');
    setText(
      'kpi-clean-sheets',
      mostClean ? `${mostClean.keeper} (${mostClean.cleanSheets})` : '—'
    );
    setText(
      'kpi-dist-acc',
      bestDist ? `${bestDist.keeper} (${bestDist.distAcc}%)` : '—'
    );
  }

  function renderGoalkeeperChart(data) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for goalkeeper chart.');
      return;
    }

    const metric =
      state.gkMetric === 'psxg'
        ? data.rows.map((row) => row.psxg)
        : data.rows.map((row) => row.savePct);

    const trace = {
      x: data.rows.map((row) => row.keeper),
      y: metric,
      type: 'bar',
      marker: {
        color: metric.map((value) => (value >= 0 ? '#16a34a' : '#ef4444')),
      },
    };

    const layout = {
      margin: { l: 40, r: 10, t: 10, b: 60 },
      yaxis: {
        title: state.gkMetric === 'psxg' ? 'PSxG +/-' : 'Save %',
        zeroline: true,
        gridcolor: '#edf0f4',
      },
    };

    Plotly.react('chart-goalkeepers', [trace], layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  function cycleGoalkeeperMetric() {
    state.gkMetric = state.gkMetric === 'psxg' ? 'save_pct' : 'psxg';
    loadGoalkeeperPanel();
  }

  /* ---------- Panel 5: Momentum & Event Flow ---------- */

  async function loadMomentumPanel() {
    const matchSelect = /** @type {HTMLSelectElement} */ (
      document.getElementById('momentum-match-filter')
    )?.value;

    const data = await fetchMomentumData({ match: matchSelect });
    renderMomentumChart(data.momentum);
    renderEventFlowDiagram(data.eventFlow);
    renderTable('match-events-table', data.eventTable);
  }

  async function fetchMomentumData(filters) {
    // TODO: Replace with timeline query.
    console.info('[placeholder] fetchMomentumData', filters);
    const momentum = Array.from({ length: 90 }, (_, minute) => ({
      minute,
      home: randomFloat(-1, 1, 2),
      away: randomFloat(-1, 1, 2),
    }));

    const eventTable = [
      { Time: "12'", Team: 'Orlando Pride', Player: 'Marta', Event: 'Goal', Detail: 'Left-footed shot' },
      { Time: "31'", Team: 'San Diego Wave', Player: 'Alex Morgan', Event: 'Shot', Detail: 'Saved' },
      { Time: "45+2'", Team: 'Orlando Pride', Player: 'Adriana', Event: 'Yellow Card', Detail: 'Foul' },
      { Time: "67'", Team: 'San Diego Wave', Player: 'Kelsey Turnbow', Event: 'Goal', Detail: 'Header' },
      { Time: "85'", Team: 'Orlando Pride', Player: 'Barbra Banda', Event: 'Penalty', Detail: 'Converted' },
    ];

    const eventFlow = {
      nodes: ['Build-up', 'Final third', 'Shot', 'Goal'],
      links: [
        { source: 'Build-up', target: 'Final third', value: 42 },
        { source: 'Final third', target: 'Shot', value: 28 },
        { source: 'Shot', target: 'Goal', value: 6 },
      ],
    };

    return {
      momentum,
      eventTable,
      eventFlow,
    };
  }

  function renderMomentumChart(momentum) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for momentum chart.');
      return;
    }
    const minutes = momentum.map((point) => point.minute);
    const home = movingAverage(momentum.map((point) => point.home), 5);
    const away = movingAverage(momentum.map((point) => point.away), 5);

    const traces = [
      {
        x: minutes,
        y: home,
        type: 'scatter',
        mode: 'lines',
        name: 'Home',
        line: { color: '#2563eb' },
      },
      {
        x: minutes,
        y: away,
        type: 'scatter',
        mode: 'lines',
        name: 'Away',
        line: { color: '#f97316' },
      },
    ];

    const layout = {
      margin: { l: 40, r: 10, t: 10, b: 40 },
      xaxis: { title: 'Minute' },
      yaxis: { title: 'Momentum (rolling xG proxy)', gridcolor: '#edf0f4' },
      legend: { orientation: 'h', x: 0, y: 1.1 },
    };

    Plotly.react('chart-momentum', traces, layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  function renderEventFlowDiagram(flow) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for event flow diagram.');
      return;
    }

    const nodeIndex = new Map(flow.nodes.map((node, idx) => [node, idx]));
    const trace = {
      type: 'sankey',
      orientation: 'h',
      node: {
        pad: 15,
        thickness: 18,
        label: flow.nodes,
        color: flow.nodes.map((node) =>
          node === 'Goal' ? '#16a34a' : '#0b69ff'
        ),
      },
      link: {
        source: flow.links.map((link) => nodeIndex.get(link.source)),
        target: flow.links.map((link) => nodeIndex.get(link.target)),
        value: flow.links.map((link) => link.value),
        color: '#9ec5ff',
      },
    };

    Plotly.react('chart-event-flow', [trace], { margin: { l: 10, r: 10, t: 10, b: 10 } }, {
      displayModeBar: false,
      responsive: true,
    });
  }

  function simulateMomentumPlayback() {
    console.info('[placeholder] Simulate momentum playback animation.');
  }

  /* ---------- Panel 6: Player Style ---------- */

  async function loadPlayerStylePanel() {
    const player = /** @type {HTMLSelectElement} */ (
      document.getElementById('player-style-filter')
    )?.value;

    const data = await fetchPlayerStyleData({ player });
    renderPlayerRadar(data.radarMetrics);
    renderPlayerHeatmap(data.heatmap);
  }

  async function fetchPlayerStyleData(filters) {
    // TODO: Replace with per-player rate stats + spatial query.
    console.info('[placeholder] fetchPlayerStyleData', filters);
    const radarMetrics = {
      labels: [
        'Progressive Carries',
        'Progressive Passes',
        'Chance Creation',
        'Pressures',
        'Shots',
        'Defensive Duels',
      ],
      values: Array.from({ length: 6 }, () => randomFloat(0.4, 1.0, 2)),
    };

    const heatmap = Array.from({ length: 140 }, () => ({
      x: randomFloat(0, 105, 1),
      y: randomFloat(0, 68, 1),
      weight: randomFloat(0.1, 1.4, 2),
    }));

    return {
      radarMetrics,
      heatmap,
    };
  }

  function renderPlayerRadar({ labels, values }) {
    if (!window.Chart) {
      console.warn('[placeholder] Chart.js unavailable for radar chart.');
      return;
    }

    const canvas = document.getElementById('chart-player-radar');
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.radarChart) {
      state.radarChart.destroy();
    }

    state.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Per 90 (scaled)',
            data: values,
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderColor: '#2563eb',
            pointBackgroundColor: '#2563eb',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: 1.2,
            angleLines: { color: '#dde3ed' },
            grid: { color: '#dde3ed' },
            ticks: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  function renderPlayerHeatmap(points) {
    if (!window.Plotly) {
      console.warn('[placeholder] Plotly unavailable for player heatmap.');
      return;
    }

    const trace = {
      x: points.map((point) => point.x),
      y: points.map((point) => point.y),
      type: 'densitymapbox',
      radius: 25,
    };

    // Use regular heatmap fallback because Mapbox token not set.
    const fallbackTrace = {
      x: points.map((point) => point.x),
      y: points.map((point) => point.y),
      type: 'histogram2dcontour',
      contours: { coloring: 'heatmap' },
      colorscale: 'YlOrRd',
      showscale: false,
    };

    const layout = {
      margin: { l: 30, r: 10, t: 10, b: 30 },
      xaxis: { title: 'Pitch X', range: [0, 105] },
      yaxis: { title: 'Pitch Y', range: [0, 68] },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
    };

    Plotly.react('chart-player-heatmap', [fallbackTrace], layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  /* ---------- Chat Placeholder ---------- */

  function setupChatPlaceholder() {
    appendChatMessage(
      'assistant',
      'Hi! I am the ChatKit assistant placeholder. Wire me up to the OpenAI ChatKit API when ready.'
    );
    appendChatMessage(
      'assistant',
      'Use the message form to simulate a chat. Replace js/main.js > setupChatPlaceholder with real ChatKit session calls.'
    );
  }

  function appendChatMessage(role, message) {
    const log = document.getElementById('chat-body');
    if (!log) return;
    const wrapper = document.createElement('div');
    wrapper.className = `chat__message chat__message--${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat__bubble';
    bubble.textContent = message;

    wrapper.appendChild(bubble);
    log.appendChild(wrapper);
    log.scrollTop = log.scrollHeight;
  }

  function toggleChatPanel() {
    const chat = document.getElementById('chatkit-panel');
    chat?.classList.toggle('chat--collapsed');
  }

  /* ---------- Utilities ---------- */

  function renderTable(tableId, rows) {
    const table = document.getElementById(tableId);
    if (!(table instanceof HTMLTableElement)) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    rows.forEach((row) => {
      const tr = document.createElement('tr');
      Object.values(row).forEach((value) => {
        const td = document.createElement('td');
        td.textContent = typeof value === 'number' ? value.toString() : String(value ?? '—');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!(table instanceof HTMLTableElement)) return;
    const rows = Array.from(table.rows).map((row) =>
      Array.from(row.cells)
        .map((cell) => `"${cell.textContent?.replace(/"/g, '""') ?? ''}"`)
        .join(',')
    );
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
  }

  function formatNumber(value) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  }

  function movingAverage(series, windowSize) {
    const averaged = [];
    for (let i = 0; i < series.length; i += 1) {
      const start = Math.max(0, i - windowSize + 1);
      const slice = series.slice(start, i + 1);
      const avg = slice.reduce((sum, value) => sum + value, 0) / slice.length;
      averaged.push(Number(avg.toFixed(2)));
    }
    return averaged;
  }

  // Public API
  return {
    init,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init().catch((error) => {
    console.error('Error bootstrapping dashboard prototype', error);
  });
});
