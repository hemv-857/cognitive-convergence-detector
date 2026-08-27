# Changelog

## v1.0.0 (2026-08-27)

### Features

- **Dashboard**: Stats row, convergence gauge, heatmap mini, network graph, alert timeline, top pairs, recent alerts, manager stats, real-time monitor
- **Correlation Heatmap**: Pairwise matrix with hover tooltip, click-to-detail with sparkline, asset class tabs
- **Alert Feed**: Bulk acknowledge, select-all, grouping, sort, filter, export
- **Managers**: Favorites filter, drill-down with signal history
- **Signals**: Signal history table with value/z-score, sort, filter, click for chart
- **Trends**: Correlation history chart, baselines table with search/pagination
- **Compare**: Dual-select managers, overlay chart, cross-correlation stats
- **Indicators**: 24+ technical indicators (SMA, EMA, Bollinger, RSI, MACD, Stochastic, ADX, Ichimoku, Williams %R, CCI, ROC, Keltner, Sharpe, Sortino, VaR)
- **Correlation Regime**: High/low/normal regime detection based on percentiles
- **Export**: CSV/JSON export for alerts and correlations
- **Settings**: Detection threshold configuration, test pipeline, how-it-works panel
- **Health**: Service status, database stats, system metrics
- **About**: System info, pipeline trigger

### Technical

- **Backend**: FastAPI + SQLAlchemy + yfinance (no Docker required)
- **Frontend**: React + Vite + Tailwind CSS (code-split, lazy-loaded)
- **Database**: SQLite (default) or PostgreSQL
- **Responsive**: Mobile-friendly with sidebar drawer
- **Theme**: Teal/cyan accent (#0ea5a5), dark mode
- **Dynamic favicon** per page
- **Dashboard widget customization** (show/hide, reorder, localStorage)
- **Keyboard shortcuts** (Cmd+K search, number keys for nav, R for pipeline)
- **Auto-refresh** every 30 seconds
- **Error boundary** with retry

### Indicators (24+)

| Indicator | Parameters |
|-----------|-----------|
| SMA | 5, 10, 20 |
| EMA | 12, 26 |
| Bollinger Bands | 20, 2σ |
| RSI | 14 |
| MACD | 12, 26, 9 |
| Stochastic | 14, 3 |
| ADX | 14 |
| Ichimoku Cloud | 9, 26, 52 |
| Williams %R | 14 |
| CCI | 20 |
| ROC | 12 |
| Keltner Channels | 20, 10, 2x |
| Volatility | 20-day |
| Sharpe Ratio | 20-day |
| Sortino Ratio | 20-day |
| VaR | 95%, 20-day |
| Drawdown | from peak |
| Drawdown Duration | days |

### Data

- 10 managers: BlackRock, Citadel, Point72, Renaissance, Jane Street, Two Sigma, Deutsche Bank, Goldman Sachs, JPMorgan, Morgan Stanley
- 30 tickers across equities (SPY, QQQ, IVV, IWM, VOO, VTI, EFA, MDY), fixed income (BND, TLT, AGG, SHY, LQD, VCIT, HYG, TIP), commodities (GLD, USO, SLV, DBC, PDBC, GSG)
- Live data via yfinance with backup tickers
- Auto-refresh every 60 minutes
