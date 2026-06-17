// Central config file — API keys, app settings, and all demo/fallback data live here.

export const API_CONFIG = {
  FINNHUB_KEY: 'd8c81tpr01qidic6oja0d8c81tpr01qidic6ojag',
  CACHE_DURATION: 1000 * 60 * 5, // 5 minutes
};

// Stocks tracked in the watchlist and market table.
// Mixed countries so the "search by country" feature has something to filter.
export const WATCHLIST_SYMBOLS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "SAP", "TM", "SHEL", "BABA"];

export const SYMBOL_NAMES = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corp.",
  AMZN: "Amazon.com",
  SAP:  "SAP SE",
  TM:   "Toyota Motor",
  SHEL: "Shell plc",
  BABA: "Alibaba Group",
};

// Maps each symbol to its home country so the market table can show and filter by country
export const SYMBOL_COUNTRIES = {
  AAPL: "United States",
  MSFT: "United States",
  TSLA: "United States",
  NVDA: "United States",
  AMZN: "United States",
  SAP:  "Germany",
  TM:   "Japan",
  SHEL: "United Kingdom",
  BABA: "China",
};

// Used when the Finnhub API is unavailable or rate-limited.
// Each row: [symbol, name, price, change%, volume, country]
export const FALLBACK_MARKET_ROWS = [
  ["AAPL", "Apple Inc.",      "$173.50",   "+1.25%", "58.2M", "United States"],
  ["MSFT", "Microsoft Corp.", "$420.21",   "+0.85%", "31.8M", "United States"],
  ["TSLA", "Tesla Inc.",      "$175.22",   "+4.50%", "92.1M", "United States"],
  ["NVDA", "NVIDIA Corp.",    "$1,037.99", "+2.18%", "45.7M", "United States"],
  ["AMZN", "Amazon.com",      "$182.12",   "-0.44%", "27.3M", "United States"],
  ["SAP",  "SAP SE",          "$225.40",   "+0.65%",  "1.2M", "Germany"],
  ["TM",   "Toyota Motor",    "$185.20",   "-0.32%",  "0.8M", "Japan"],
  ["SHEL", "Shell plc",       "$68.90",    "+0.42%",  "3.5M", "United Kingdom"],
  ["BABA", "Alibaba Group",   "$115.30",   "+1.85%",  "8.7M", "China"],
];

export const FALLBACK_QUOTE = { c: 150.0, d: 1.25, dp: 0.85 };

// Placeholder data shown on the dashboard cards while real market data loads
export const DEMO_METRICS = [
  ["PORTFOLIO VALUE", "$42,850", "+2.4% today", true],
  ["DAILY P/L", "+$580.00", "+$128 last hour", true],
  ["WATCHLIST", "18 assets", "4 alerts active", true],
  ["MARKET STATUS", "Open", "Berlin • 15:42", true],
];

// Demo data for the portfolio summary card
export const DEMO_PORTFOLIO_SUMMARY = {
  totalValue: "$24,140.65",
  todayChange: "+$580.00 (+2.46%)",
  totalGain: "+$1,840.65 (+8.27%)",
  invested: "$22,300.00",
};

// Demo data for the asset allocation chart on the portfolio page
export const DEMO_ALLOCATION = [
  { label: "AAPL", value: "$7,850.25", pct: 32.5, color: "var(--accent)" },
  { label: "MSFT", value: "$6,840.40", pct: 28.3, color: "var(--green)" },
  { label: "BTC", value: "$9,450.00", pct: 39.2, color: "#e7bf99" },
];

// Demo holdings for the portfolio table
export const DEMO_HOLDINGS = [
  { symbol: "AAPL", name: "Apple Inc.", shares: "45 shares", avgCost: "$162.10", price: "$174.45", value: "$7,850.25", totalGain: "+7.6%" },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: "20 shares", avgCost: "$310.50", price: "$342.02", value: "$6,840.40", totalGain: "+10.2%" },
  { symbol: "BTC", name: "Bitcoin", shares: "0.15 coins", avgCost: "$58,200.00", price: "$63,000.00", value: "$9,450.00", totalGain: "+8.3%" },
];
