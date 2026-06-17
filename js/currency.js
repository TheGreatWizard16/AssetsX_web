// Supported currencies and their approximate conversion rates from USD
const RATES = {
  USD: { symbol: '$',  rate: 1.0    },
  EUR: { symbol: '€',  rate: 0.92   },
  GBP: { symbol: '£',  rate: 0.79   },
  JPY: { symbol: '¥',  rate: 149.50 },
};

// Read the saved currency from localStorage, defaulting to USD
export function getCurrency() {
  const code = localStorage.getItem('assetsx_currency') || 'USD';
  return { code, ...(RATES[code] || RATES.USD) };
}

// Save the selected currency code to localStorage so it persists across pages
export function setCurrency(code) {
  if (RATES[code]) localStorage.setItem('assetsx_currency', code);
}

// Convert a USD number to the selected currency and format it with the right symbol
export function formatWithCurrency(usdValue) {
  if (typeof usdValue !== 'number') return 'N/A';
  const { symbol, rate } = getCurrency();
  return `${symbol}${(usdValue * rate).toFixed(2)}`;
}

export const CURRENCY_CODES = Object.keys(RATES);
