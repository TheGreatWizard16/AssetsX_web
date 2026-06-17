// Show a "no data" message inside the chart container when the API returns nothing
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

// Remove the placeholder before drawing a fresh chart so they don't stack
function removeChartPlaceholder(canvas) {
  const existingPlaceholder = canvas.parentElement.querySelector('.chart-placeholder');
  if (existingPlaceholder) existingPlaceholder.remove();
  canvas.style.display = 'block';
}

// Draw a price history line chart on a canvas element.
// chartData should be { labels: [...dates], prices: [...numbers] }
export function initStockChart(canvasId, chartData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded. Check the script tag in the HTML.");
    return;
  }

  removeChartPlaceholder(canvas);

  if (!chartData || !chartData.prices || chartData.prices.length === 0) {
    showChartPlaceholder(canvas);
    return;
  }

  // Read the green color from our CSS variables so the chart matches the theme
  const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';

  // Destroy the previous chart on this canvas before drawing a new one
  const existingChart = Chart.getChart(canvasId);
  if (existingChart) existingChart.destroy();

  // Mini charts on the sign-in page don't need point dots
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
      // maintainAspectRatio false lets the chart fill the parent container's height
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}
