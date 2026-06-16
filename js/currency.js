const RATES = {
  USD: { symbol: '$',  rate: 1.0    },
  EUR: { symbol: '€',  rate: 0.92   },
  GBP: { symbol: '£',  rate: 0.79   },
  JPY: { symbol: '¥',  rate: 149.50 },
};

export function getCurrency() {
  const code = localStorage.getItem('assetsx_currency') || 'USD';
  return { code, ...(RATES[code] || RATES.USD) };
}

export function setCurrency(code) {
  if (RATES[code]) localStorage.setItem('assetsx_currency', code);
}

export function formatWithCurrency(usdValue) {
  if (typeof usdValue !== 'number') return 'N/A';
  const { symbol, rate } = getCurrency();
  return `${symbol}${(usdValue * rate).toFixed(2)}`;
}

export const CURRENCY_CODES = Object.keys(RATES);
