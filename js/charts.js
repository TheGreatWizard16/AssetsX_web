// Draw a doughnut chart for the asset allocation card.
// Uses chartjs-plugin-datalabels to show percentage labels on each segment.
export function initDoughnutChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  const existing = Chart.getChart(canvasId);
  if (existing) existing.destroy();

  const plugins = [];
  if (typeof ChartDataLabels !== 'undefined') plugins.push(ChartDataLabels);

  new Chart(canvas, {
    type: 'doughnut',
    plugins,
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: data.colors,
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--panel').trim() || '#0d1929',
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: {
          color: '#ffffff',
          font: { size: 11, weight: '700', family: 'system-ui, sans-serif' },
          formatter: (value) => `${Math.round(value)}%`,
        },
      },
    },
  });
}

// Show a message inside the chart area when no data is available
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

// Remove the placeholder before drawing a new chart so they don't overlap
function removeChartPlaceholder(canvas) {
  const existingPlaceholder = canvas.parentElement.querySelector('.chart-placeholder');
  if (existingPlaceholder) existingPlaceholder.remove();
  canvas.style.display = 'block';
}

// Draw a price history line chart on the given canvas element.
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

  // Read the green color from CSS variables so the chart matches the theme
  const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';

  // Destroy the existing chart on this canvas before drawing a new one,
  // otherwise Chart.js throws a warning about reusing a canvas
  const existingChart = Chart.getChart(canvasId);
  if (existingChart) existingChart.destroy();

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
