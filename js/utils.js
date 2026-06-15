/*
 * utils.js
 * --------
 * Small, reusable helper functions that don't belong to any one page:
 * trend/sparkline helpers, time formatting, and the toast notification.
 */

// Returns true if a "+1.25%" / "-0.44%" style change string represents an
// upward trend. An empty/missing value is treated as "up" (green).
export function isTrendUp(changeText) {
  if (!changeText) return true;
  return !changeText.trim().startsWith("-");
}

// Returns a small inline SVG sparkline, colored green for an upward trend
// and red for a downward trend. The point coordinates are fixed demo
// shapes (one "up" line, one "down" line).
export function sparkline(isUp = true) {
  const upPoints = "0,24 14,18 25,20 38,9 51,13 62,4 74,8";
  const downPoints = "0,7 15,11 26,6 39,15 52,12 74,21";
  const points = isUp ? upPoints : downPoints;
  const color = isUp ? "var(--green)" : "var(--red)";

  return `
    <svg class="sparkline" viewBox="0 0 74 28" aria-hidden="true">
      <polyline class="line" style="stroke:${color}" points="${points}" />
    </svg>
  `;
}

// Converts a Unix timestamp (seconds) into a short relative time string,
// e.g. "5m ago", "3h ago", "2d ago".
export function formatTimeAgo(timestamp) {
  const secondsAgo = Math.floor(Date.now() / 1000 - timestamp);

  if (secondsAgo < 60) return "just now";

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo}d ago`;
}

// Shows a temporary toast message in the bottom-right corner. Any
// previously visible toast is removed first so they don't stack up.
export function showToast(message) {
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Fade in shortly after being added to the DOM.
  setTimeout(() => toast.classList.add("visible"), 10);

  // Fade out and remove after a few seconds.
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 200);
  }, 2400);
}
