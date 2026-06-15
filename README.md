# AssetsX

AssetsX is a responsive stock market web app prototype built with plain HTML, CSS, and JavaScript.

The design follows the same visual language as the mobile Figma app: dark finance UI, blue-gray accents, green/red price movement, compact cards, charts, sidebar navigation, and professional dashboard spacing.

## Technologies

- HTML
- CSS
- JavaScript

No React, Vue, Bootstrap, Tailwind, or backend framework is used.

## How To Run

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

- `index.html` redirects into the same Sign In experience.
- `signin.html` shows the Sign In page.
- `signup.html` shows the Sign Up page.
- `home.html` shows the dashboard.
- `markets.html` shows the live market table.
- `stock.html` shows the Apple stock detail page.
- `portfolio.html` shows portfolio balance, allocation, and holdings.
- `news.html` shows market news cards.
- `pro.html` shows the Pro subscription page.

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
    config.js   - API keys, cache duration, demo/fallback data
    state.js    - shared in-memory data (market rows, news, location)
    cache.js    - sessionStorage caching helpers
    api.js      - all Finnhub + geolocation network requests
    utils.js    - formatters, toast notifications, sparkline SVG
    charts.js   - Chart.js setup and "no data" placeholder
    pages.js    - fills in the dynamic content for each page
    events.js   - click/search interactions
    main.js     - entry point, page routing
  package.json
  README.md
```

## How The JavaScript Works

Each HTML file has a `data-page` value on the `<body>` tag.

Example:

```html
<body data-page="markets">
```

`js/main.js` reads that value:

```js
document.body.dataset.page
```

and calls the matching render function from `js/pages.js` (e.g.
`renderMarketsPage()`), which fills in the placeholder containers already
present in the HTML (e.g. `<tbody id="market-table-body">`).

Splitting the old single `app.js` file into the small modules above keeps
each file focused on one responsibility (config, data fetching, caching,
rendering, or interactions), which makes the codebase easier to navigate
and extend without changing any existing behavior.

## Button Behavior

- Sign In and Sign Up forms navigate to `home.html`.
- Sidebar links navigate to real HTML files.
- Export downloads example market data as a CSV file.
- Trade buttons open `stock.html`.
- Buy, Sell, Forgot Password, Social Login, and Pro buttons show demo feedback messages.
- Market search filters the stock table.
- Filter pills and chart range pills switch their active state when clicked.

## Project Notes

The stock and portfolio data is currently static example data. It is written in a way that can later be replaced by a real stock API such as Marketstack.
