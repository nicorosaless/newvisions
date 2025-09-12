import { getTokenData } from '../state.js';

export function renderTokenScreen() {
  const tokenInfo = getTokenData();
  const usedTokens = tokenInfo.used;
  const totalTokens = tokenInfo.total;
  const remainingTokens = totalTokens - usedTokens;
  const usagePercentage = ((usedTokens / totalTokens) * 100).toFixed(1);
  const now = new Date();
  const resetDate = tokenInfo.resetDate;
  const daysUntilReset = Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24));
  const resetDateFormatted = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Circumference for ring (r=54) -> 2 * PI * 54 ≈ 339.29
  const circumference = 339.29;
  const progressStroke = (usagePercentage * circumference) / 100;

  return `
  <div class="tokens-page">
    <header class="tokens-topbar">
      <button class="icon-btn" id="back-to-home" aria-label="Back">
        <span class="icon-btn-chevron">←</span>
      </button>
      <h1 class="tokens-title">Usage</h1>
      <div class="topbar-spacer"></div>
    </header>
    <main class="tokens-main" role="main">
      <section class="progress-panel glass-panel">
        <div class="progress-ring" aria-label="Usage ${usagePercentage}%">
          <svg viewBox="0 0 120 120" class="progress-ring-svg">
            <circle cx="60" cy="60" r="54" class="ring-background" />
            <circle cx="60" cy="60" r="54" class="ring-progress" stroke-dasharray="${progressStroke} ${circumference}" />
          </svg>
          <div class="progress-center">
            <span class="progress-value">${usagePercentage}<span class="progress-unit">%</span></span>
            <span class="progress-label">used</span>
          </div>
        </div>
        <div class="inline-stats">
          <div class="inline-stat"><span class="stat-label subtle">Used</span><span class="stat-value">${usedTokens.toLocaleString()}</span></div>
          <div class="inline-stat"><span class="stat-label subtle">Remaining</span><span class="stat-value">${remainingTokens.toLocaleString()}</span></div>
          <div class="inline-stat"><span class="stat-label subtle">Total</span><span class="stat-value">${totalTokens.toLocaleString()}</span></div>
        </div>
      </section>
      <section class="metrics-grid">
        <div class="metric-card glass-panel accent">
          <div class="metric-label">Next Reset</div>
          <div class="metric-number">${resetDateFormatted}</div>
          <div class="metric-trend subtle">${daysUntilReset} days left</div>
          <p class="reset-note-text">Tokens refresh automatically on the 1st of each month. Usage resets at 00:00 UTC.</p>
        </div>
      </section>
    </main>
  </div>`;
}
