# AssetsX

A responsive stock market web app built as a final exam project for the **University of Europe for Applied Sciences** — Frontend Programming module (SoSe 2026).

**Live:** [assetsx-web.vercel.app](https://assetsx-web.vercel.app)
**GitHub:** [TheGreatWizard16/AssetsX_web](https://github.com/TheGreatWizard16/AssetsX_web)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 — mobile-first, custom dark theme |
| Scripting | Vanilla JavaScript (ES modules) |
| UI Framework | Bootstrap 5.3 (CDN) — required by exam spec |
| Charts | Chart.js (CDN) — required by exam spec |
| Auth | Firebase Authentication (email / password) |
| Market Data | Finnhub Stock API — real-time quotes, candles, news, company profiles |
| Geolocation | ipapi.co — IP-based city/country for the header |
| Hosting | Vercel (auto-deploy from GitHub main branch) |

---

## Pages

| File | Description |
|---|---|
| `index.html` | Landing / sign-in entry point |
| `signin.html` | Email + password sign-in (Firebase Auth) |
| `signup.html` | New account registration (Firebase Auth) |
| `home.html` | Dashboard — greeting, portfolio metrics, performance chart, watchlist, news |
| `markets.html` | Live market table — search, country filter, region pills (Americas / Europe / Asia) |
| `stock.html` | Stock detail — hero card, 52-week range, price chart (1D/1M/3M/1Y), key stats, company profile, related news |
| `portfolio.html` | Portfolio — value chart, asset allocation donut chart, holdings table with sparklines |
| `news.html` | General market news feed with category tabs |
| `pro.html` | Pro subscription page — feature grid and Free vs Pro comparison |

---

## Features

- **Real-time prices** — live stock data from Finnhub with 5-minute sessionStorage caching to avoid rate limits
- **International stocks** — AAPL, MSFT, TSLA, NVDA, AMZN (US), SAP (Germany), TM (Japan), SHEL (UK), BABA (China)
- **Search by symbol, company, or country** — filters live as you type; Enter with a ticker symbol navigates to that stock's page
- **Region filter** — Americas / Europe / Asia-Pacific pills on the markets page filter by country column
- **Price history tabs** — 1D / 1M / 3M / 1Y on the stock detail page re-fetch candle data and redraw the chart
- **Portfolio performance chart** — 30-day portfolio value line chart on the portfolio page summary card
- **Asset allocation donut chart** — Chart.js doughnut showing AAPL / MSFT / BTC split
- **Holdings table with sparklines** — per-row trend indicator next to each position
- **Currency switching** — USD / EUR / GBP / JPY selector in the top bar; preference persists in localStorage
- **Geolocation header** — city and country shown in the subtitle via ipapi.co
- **Firebase auth** — email/password sign-in and sign-up; unauthenticated users are redirected
- **Color-coded sentiment** — green for gains, red for losses across all badges, cards, and the 52-week range bar
- **Responsive layout** — sidebar + content grid on desktop (≥1050px), stacked layout on tablet, bottom tab bar on mobile (≤680px)
- **Instant render** — fallback market data renders immediately on page load; real API data replaces it in the background so mobile users never see a blank screen
- **Official logo** — SVG icon used in the sidebar, auth pages, and browser tab favicon

---

## File Structure

```
AssetsX/
├── index.html          sign-in entry point
├── signin.html
├── signup.html
├── home.html
├── markets.html
├── stock.html
├── portfolio.html
├── news.html
├── pro.html
├── styles.css          all styles — variables, layout, components, responsive
├── logo.svg            official app icon
├── package.json
└── js/
    ├── main.js         app entry point — reads data-page and routes to the right renderer
    ├── pages.js        render functions for each page (home, markets, stock, portfolio, news, auth)
    ├── events.js       click/input event listeners — search, row nav, range tabs, region filter
    ├── api.js          Finnhub + geolocation fetch calls
    ├── config.js       API keys, watchlist symbols, country map, all demo/fallback data
    ├── state.js        shared in-memory store (market rows, news items, user location)
    ├── cache.js        sessionStorage helpers with 5-minute TTL
    ├── currency.js     USD / EUR / GBP / JPY conversion with localStorage persistence
    ├── charts.js       Chart.js line chart, doughnut chart, and no-data placeholder
    ├── utils.js        price formatters, toast notifications, sparkline SVG generator
    └── firebase.js     Firebase app + Auth initialisation
```

---

## How It Works

Every HTML file has a `data-page` attribute on `<body>`:

```html
<body data-page="markets">
```

`main.js` reads that value and calls the matching render function from `pages.js` (e.g. `renderMarketsPage()`). On app pages, it renders immediately with fallback data then re-renders once the Finnhub API responds — so the UI is never blocked by a slow network.

Each JS module has one clear job: `config.js` for constants, `api.js` for network calls, `cache.js` for caching, `pages.js` for rendering, `events.js` for interactions.

---

## Running Locally

```bash
npm run dev
```

Then open `http://localhost:5173`. No build step — it's a static site served by Python's built-in HTTP server.

---

## Project Context

Built for the **Frontend Programming** final exam at UE (University of Europe for Applied Sciences), SoSe 2026. The web app is the companion to a separate Flutter mobile app. Exam requirements met:

- Bootstrap 5 integration
- Chart.js charts with functional range tabs
- Firebase Authentication (sign-in + sign-up)
- Real external API (Finnhub)
- Search and filtering (by name, symbol, and country)
- Currency conversion (USD / EUR / GBP / JPY)
- Fully responsive across desktop, tablet, and mobile
