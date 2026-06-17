# AssetsX

AssetsX is a responsive stock market web app built as a final exam project for the University of Europe for Applied Sciences Frontend Programming module (SoSe 2026).

The design follows a dark finance UI with blue-gray accents, green/red price sentiment, compact cards, Chart.js line charts, a sidebar navigation for desktop, and a bottom tab bar for mobile.

## Technologies

- HTML5
- CSS3 (responsive, mobile-first)
- Vanilla JavaScript (ES modules)
- Bootstrap 5.3 (CDN) — required by the project specification
- Chart.js (CDN) — required by the project specification
- Firebase Authentication (email / password sign-in)
- Finnhub Stock API (real-time quotes, candles, news, company profiles)
- ipapi.co (IP-based geolocation for the header location pill)

## How To Run (local development)

Open the project folder in VS Code:

```text
/Users/abraham/Desktop/AssetsX
```

Then run:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Pages

- `index.html` — redirects to the sign-in page
- `signin.html` — email/password sign-in (Firebase Auth)
- `signup.html` — new account registration (Firebase Auth)
- `home.html` — main dashboard: greeting, metrics, portfolio chart, watchlist, news
- `markets.html` — live market table with search and currency switching
- `stock.html` — detailed stock page: hero card, 52-week range bar, price chart (1D/1M/3M/1Y tabs), key stats, company profile, related news
- `portfolio.html` — portfolio balance, asset allocation chart, holdings list
- `news.html` — general market news feed
- `pro.html` — Pro subscription / upgrade page

## File Structure

```text
AssetsX/
  index.html
  signin.html
  signup.html
  home.html
  markets.html
  stock.html
  portfolio.html
  news.html
  pro.html
  styles.css
  js/
    config.js      - API keys, cache settings, demo/fallback data
    state.js       - shared in-memory data (market rows, news, location)
    cache.js       - sessionStorage helpers with 5-minute TTL
    api.js         - Finnhub + geolocation fetch calls
    currency.js    - USD / EUR / GBP / JPY conversion with localStorage
    utils.js       - price formatters, toast, sparkline SVG
    charts.js      - Chart.js setup and "no data" placeholder
    pages.js       - renders the dynamic content for each page
    events.js      - search, row navigation, range tab interactions
    main.js        - entry point, page routing
    firebase.js    - Firebase app + auth initialisation
  package.json
  README.md
```

## How The JavaScript Works

Each HTML file has a `data-page` attribute on its `<body>` tag:

```html
<body data-page="markets">
```

`js/main.js` reads that value and calls the matching render function from `js/pages.js` (e.g. `renderMarketsPage()`), which fills the placeholder containers already in the HTML.

Modules are kept small and focused — `config.js` for constants, `api.js` for network calls, `cache.js` for caching, `pages.js` for rendering, and `events.js` for interactions — so each file has one clear responsibility.

## Key Features

- **Color-coded sentiment** — green for gains, red for losses, applied to badges, metric cards, the stock hero, and the 52-week range bar
- **Search** — filters visible rows/cards live as you type; pressing Enter with a 1–5 letter symbol navigates directly to that stock's detail page
- **Price history tabs** — 1D / 1M / 3M / 1Y tabs on `stock.html` re-fetch candle data from Finnhub and redraw the chart
- **Currency switching** — USD / EUR / GBP / JPY selector in the top bar; preference stored in `localStorage`
- **Geolocation** — city and country shown in the header subtitle via ipapi.co
- **Authentication** — Firebase email/password sign-in; auth guard redirects unauthenticated users
- **Responsive layout** — sidebar + content grid on desktop, bottom tab bar on mobile (≤680 px)
