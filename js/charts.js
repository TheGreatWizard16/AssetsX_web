/*
 * charts.js
 * ---------
 * Wraps Chart.js so the rest of the app can draw a price-history line
 * chart with a single function call, including handling the "no data"
 * placeholder state.
 */

// Replaces a missing/empty chart with a placeholder message and hides
// the (empty) canvas.
function showChartPlaceholder(canvas) {
  canvas.style.display = "none";

  const placeholder = document.createElement("div");
  placeholder.className = "chart-placeholder";
  placeholder.innerHTML = `
    <p class="muted mono" style="margin:0;">Chart data currently unavailable</p>
    <small class="muted">Market Closed or API Limit reached</small>
  `;
  canvas.after(placeholder);
}

// Removes any previously-added "no data" placeholder so it doesn't
// duplicate when a chart is re-rendered.
function removeChartPlaceholder(canvas) {
  const existingPlaceholder = canvas.parentElement.querySelector('.chart-placeholder');
  if (existingPlaceholder) {
    existingPlaceholder.remove();
  }
  canvas.style.display = 'block';
}

/*
 * Draws (or redraws) a line chart of closing prices into the <canvas>
 * with the given id.
 *
 * `chartData` is expected to look like:
 *   { labels: ["1/1/2024", ...], prices: [123.4, ...] }
 *
 * If `chartData` is missing/empty, a placeholder message is shown
 * instead of an empty chart.
 */
export function initStockChart(canvasId, chartData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    console.error("AssetsX: Chart.js library not loaded. Check your HTML script tags.");
    return;
  }

  removeChartPlaceholder(canvas);

  if (!chartData || !chartData.prices || chartData.prices.length === 0) {
    showChartPlaceholder(canvas);
    return;
  }

  const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';

  // Destroy any existing chart on this canvas before drawing a new one.
  const existingChart = Chart.getChart(canvasId);
  if (existingChart) {
    existingChart.destroy();
  }

  // Mini charts (sign in/up preview) don't show point markers.
  const isMiniChart = canvasId.includes('mini');

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: chartData.labels || [],
      datasets: [{
        data: chartData.prices,
        borderColor: lineColor,
        tension: 0.4,
        fill: false,
        pointRadius: isMiniChart ? 0 : 2,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}
