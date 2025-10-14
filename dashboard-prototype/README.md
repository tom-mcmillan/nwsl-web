# NWSL Dashboard Prototype

Static prototype of the S&P Capital IQ–style NWSL analytics dashboard refactored from the original `nwsl_dashboard.html` and `nwsl_dashboard_advanced.html` single-file drafts. The goal is to provide a clean front-end scaffold with externalised styling and modular JavaScript, ready to connect to live data sources and richer visualisations.

## Project Structure

```
dashboard-prototype/
├── index.html          # Dashboard markup and panel layout
├── css/
│   └── style.css       # Theme variables, layout, typographic styles
└── js/
    └── main.js         # Placeholder data layer, visualisation hooks, interactivity
```

External dependencies are loaded via CDN:

- [Plotly.js](https://plotly.com/javascript/) for bar charts, heatmaps, Sankey diagrams, and momentum plots.
- [Chart.js](https://www.chartjs.org/) for the player radar visualisation.
- [GridStack](https://gridstackjs.com/) to demonstrate how drag-and-resize behaviour would be wired in. If the library fails to load, panels fall back to CSS grid with native resize handles.

## Running the Prototype

No build tooling is required.

1. Open `index.html` directly in a browser **or** serve the folder with any static server (e.g., `npx serve dashboard-prototype`).
2. Ensure an internet connection is available so the CDN scripts can load.
3. Interact with the UI; all metrics, tables, and charts are populated with placeholder data to demonstrate the layout.

## Integrating Real Data

All fetch logic lives in `js/main.js`. Each panel has a clearly named placeholder function that should be replaced with calls to your backend API or database layer:

| Panel | Placeholder function |
|-------|----------------------|
| Headline metrics | `fetchHeadlineMetrics` |
| Team overview | `fetchTeamOverviewData` |
| Player valuation | `fetchPlayerValuationData` |
| Tactical analysis | `fetchTacticalData` |
| Goalkeeper performance | `fetchGoalkeeperData` |
| Match momentum & event flow | `fetchMomentumData` |
| Player style & role | `fetchPlayerStyleData` |

Replace the sample data inside each function with real fetch logic (REST, GraphQL, etc.), parse the results in the companion `process*` functions if needed, and the renderers will update automatically.

### Visualisations

- Plotly charts are initialised via `Plotly.react`. To customise styling or behaviour, adjust the traces/layout objects inside the relevant `render*` functions.
- The radar chart uses Chart.js. Swap data or configuration in `renderPlayerRadar`.
- Heatmaps and flow/Sankey diagrams are wired but fed with random data. Once x/y coordinates (pitch positions, event sequences) are available, pass them to the helper functions in the same shape.

### Interactive Layout

`initializeLayout()` attempts to create a GridStack instance. When you are ready to support drag-and-drop layouts, include any additional GridStack configuration here or swap to a different layout engine. Without GridStack present, panels still honour CSS `resize: both` for basic experimentation.

### Chat Assistant Placeholder

`setupChatPlaceholder()` in `main.js` seeds mock messages. Integrate OpenAI ChatKit (or preferred chat system) by replacing this function and the form submit handler with real session creation/refresh calls.

## Styling Notes

The typography, spacing, and chip styles follow the Capital IQ Pro aesthetic defined in the source HTML. Variables in `css/style.css` can be tweaked to adjust colours or shadows globally.

## Next Steps

- Point the placeholder fetch functions at real API endpoints.
- Feed full-resolution event data to the heatmap and distribution charts.
- Finish the drag/resizing story by keeping GridStack initialised (optional persistence via localStorage).
- Swap placeholder chat logic for the actual ChatKit integration.

> Everything marked as `[placeholder]` in the console logs or comments indicates code that must be replaced when wiring the dashboard into production services.
