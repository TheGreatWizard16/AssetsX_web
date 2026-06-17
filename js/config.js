// API key and cache settings for Finnhub
export const API_CONFIG = {
  FINNHUB_KEY: 'd8c81tpr01qidic6oja0d8c81tpr01qidic6ojag',
  CACHE_DURATION: 1000 * 60 * 5, // 5 minutes in milliseconds
};

// Stocks shown in the watchlist and market table
export const WATCHLIST_SYMBOLS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN"];

export const SYMBOL_NAMES = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corp.",
  AMZN: "Amazon.com",
};

// Fallback data shown if the API is unavailable or the request fails
export const FALLBACK_MARKET_ROWS = [
  ["AAPL", "Apple Inc.", "$173.50", "+1.25%", "58.2M"],
  ["MSFT", "Microsoft Corp.", "$420.21", "+0.85%", "31.8M"],
  ["TSLA", "Tesla Inc.", "$175.22", "+4.50%", "92.1M"],
  ["NVDA", "NVIDIA Corp.", "$1,037.99", "+2.18%", "45.7M"],
  ["AMZN", "Amazon.com", "$182.12", "-0.44%", "27.3M"],
];

export const FALLBACK_QUOTE = { c: 150.0, d: 1.25, dp: 0.85 };

// Demo data shown on the dashboard while real market data loads
export const DEMO_METRICS = [
  ["PORTFOLIO VALUE", "$42,850", "+2.4% today", true],
  ["DAILY P/L", "+$580.00", "+$128 last hour", true],
  ["WATCHLIST", "18 assets", "4 alerts active", true],
  ["MARKET STATUS", "Open", "Berlin • 15:42", true],
];

// Demo portfolio summary shown on the Portfolio page
export const DEMO_PORTFOLIO_SUMMARY = {
  totalValue: "$24,140.65",
  todayChange: "+$580.00 (+2.46%)",
  totalGain: "+$1,840.65 (+8.27%)",
  invested: "$22,300.00",
};

// Demo asset allocation breakdown for the stacked bar chart
export const DEMO_ALLOCATION = [
  { label: "AAPL", value: "$7,850.25", pct: 32.5, color: "var(--accent)" },
  { label: "MSFT", value: "$6,840.40", pct: 28.3, color: "var(--green)" },
  { label: "BTC", value: "$9,450.00", pct: 39.2, color: "#e7bf99" },
];

// Demo holdings list shown in the Portfolio page table
export const DEMO_HOLDINGS = [
  { symbol: "AAPL", name: "Apple Inc.", shares: "45 shares", avgCost: "$162.10", price: "$174.45", value: "$7,850.25", totalGain: "+7.6%" },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: "20 shares", avgCost: "$310.50", price: "$342.02", value: "$6,840.40", totalGain: "+10.2%" },
  { symbol: "BTC", name: "Bitcoin", shares: "0.15 coins", avgCost: "$58,200.00", price: "$63,000.00", value: "$9,450.00", totalGain: "+8.3%" },
];
