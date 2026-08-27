# Cognitive Convergence Detector

Measures institutional trading signal correlation and detects convergence events using 10 managers across 3 asset classes with 30 live market tickers.

## Features

- **Live market data** via yfinance (SPY, QQQ, BND, GLD, etc.)
- **Rolling Pearson correlation** between all manager pairs
- **3-level convergence detection** (pair, class, system)
- **24+ technical indicators**: SMA, EMA, Bollinger Bands, RSI, MACD, Stochastic, ADX, Ichimoku Cloud, Williams %R, CCI, ROC, Keltner Channels, Sharpe, Sortino, VaR
- **Correlation regime detection** (high/low/normal)
- **Dashboard widget customization** (show/hide, reorder, persist)
- **Responsive mobile layout** with sidebar drawer
- **Dynamic favicon** per page
- **Alert feed** with bulk acknowledge, filtering, sorting
- **Manager comparison** with overlay charts
- **Data export** (CSV/JSON)

## Quick start

```bash
# 1. Clone and set up backend
cd cognitive-convergence-detector
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 2. Set up frontend
cd frontend
npm install

# 3. Start backend (port 8000)
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 4. Start frontend (port 4173, in another terminal)
cd ../frontend
npm run dev
```

Open http://localhost:4173

## Architecture

```
backend/                  # FastAPI + SQLAlchemy
├── app/
│   ├── main.py           # All API endpoints
│   ├── models.py         # Signal, CorrelationMatrix, Baseline, Alert
│   ├── config.py         # Settings via pydantic-settings
│   ├── database.py       # SQLAlchemy engine (SQLite/PostgreSQL)
│   ├── stats/
│   │   ├── indicators.py # 24+ technical indicators
│   │   ├── correlation.py # Rolling Pearson + baselines
│   │   ├── convergence.py # 3-level detection
│   │   └── normalizer.py # Z-score normalization
│   ├── ingestion/
│   │   └── market_data.py # yfinance data fetcher
│   ├── alerts/
│   │   └── router.py     # Discord/email alerts
│   └── tasks/
│       └── pipeline.py   # Data pipeline

frontend/                 # React + Vite + Tailwind
├── src/
│   ├── pages/            # 12 pages
│   ├── components/       # 17 components
│   ├── hooks/            # useFetch, useWidgetConfig
│   └── lib/api.js        # API client
```

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/convergence/current` | Latest convergence snapshot |
| `GET /api/v1/correlations/matrix` | Pairwise correlations |
| `GET /api/v1/correlations/history` | Rolling correlation time-series |
| `GET /api/v1/correlations/regime/{asset_class}` | Correlation regime detection |
| `GET /api/v1/baselines` | Historical baselines |
| `GET /api/v1/signals/latest` | Latest normalized signals |
| `GET /api/v1/signals/history` | Signal time-series |
| `GET /api/v1/indicators/{manager_id}/{signal_id}` | 24+ technical indicators |
| `GET /api/v1/alerts/recent` | Recent alerts |
| `POST /api/v1/alerts/{id}/acknowledge` | Acknowledge alert |
| `GET /api/v1/managers` | List managers |
| `GET /api/v1/stats/summary` | System statistics |
| `GET /api/v1/stats/managers` | Per-manager stats |
| `POST /api/v1/pipeline/run` | Trigger pipeline |
| `GET /api/v1/health/detailed` | System health |

Visit http://localhost:8000/docs for Swagger UI.

## Indicators

| Category | Indicators |
|----------|-----------|
| **Trend** | SMA (5/10/20), EMA (12/26), Ichimoku Cloud, Keltner Channels |
| **Momentum** | RSI, MACD, Stochastic, Williams %R, CCI, ROC |
| **Volatility** | Bollinger Bands, ATR-based Keltner, rolling std |
| **Risk** | Drawdown, DD Duration, VaR (95%), Sharpe, Sortino |
| **Strength** | ADX, correlation regime |

## Tech stack

- **Backend**: FastAPI, SQLAlchemy, pandas, numpy, scipy, yfinance
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide icons
- **Database**: SQLite (default) or PostgreSQL
- **Theme**: Teal/cyan accent (#0ea5a5), dark mode

## Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=sqlite:///convergence.db
DISCORD_WEBHOOK_URL=your_webhook_url  # optional
ALERT_EMAIL=your@email.com            # optional
```

## License

MIT
