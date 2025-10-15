## Capital IQ Dashboard Patterns

- **Consistent typographic scale** – the interface relies on a single compact font size and weight (for headers, table cells, and toolbars) so rows remain shallow and large datasets fit on screen.
- **Rigid grid & docking** – widgets live inside thin-bordered panels that snap to a shared multi-column grid; per-panel tabs and accordions (e.g., “Global Indices”, “Markets”, “FX/Crypto”) let one frame multiplex multiple datasets without expanding vertically.
- **Compact chrome** – toolbars use icon buttons, succinct dropdowns, and inline filters; controls like date ranges or currency switches sit within the panel header rather than in separate modules.
- **Color and alignment cues** – directional data (gainers/losers, heatmaps) uses color fills instead of verbose labels, while numeric columns align right and text aligns left to enable quick scanning.
- **Layered navigation** – stacked navigation bars (global nav, section tabs, panel tabs) swap content in place so the user accesses new data without leaving the primary layout.
- **Independent scrolling** – each panel scrolls independently, allowing marquee widgets to stay visible while long tables or feeds update in adjacent panes.
- **Abbreviated labeling** – tickers, short column headers, and reliance on tooltips keep column widths narrow, increasing column count per table.
- **In-place live context** – watchlists, news feeds, and alerts update within their panels, eliminating modal interruptions and preserving the at-a-glance board.

Use these patterns as a reference when shaping the high-density NWSL analytics terminal.
