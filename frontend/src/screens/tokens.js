import { getUserCredits } from '../state.js';

export function renderTokenScreen() {
  const credits = getUserCredits();
  const usedTokens = typeof credits.charCount === 'number' ? credits.charCount : 0;
  const totalTokens = typeof credits.monthlyLimit === 'number' ? credits.monthlyLimit : 0;
  const remainingTokens = totalTokens > 0 ? (totalTokens - usedTokens) : 0;
  const usagePercentage = totalTokens > 0 ? ((usedTokens / totalTokens) * 100).toFixed(1) : '0.0';
  const now = new Date();
  const resetDate = credits.resetDate;
  const daysUntilReset = Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24));
  const resetDateFormatted = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Circumference for ring (r=54) -> 2 * PI * 54 ≈ 339.29
  const circumference = 339.29;
  const progressStroke = (usagePercentage * circumference) / 100;

  return `
  <div class="tokens-page">
    <div class="settings-container">
      <div class="settings-header">
        <button class="back-button" id="back-to-home" aria-label="Back">
          <span class="back-arrow">←</span>
        </button>
        <h1>Usage</h1>
        <div class="spacer"></div>
      </div>

      <div class="settings-content">
        <!-- Usage Summary -->
        <div class="settings-section">
          <div class="settings-group">
            <div class="progress-panel" style="padding: 1.25rem;">
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
            </div>
          </div>
        </div>

        <!-- Billing / Reset Info -->
        <div class="settings-section">
          <h2 class="section-title">Billing</h2>
          <div class="settings-group">
            <div class="settings-item">
              <div class="setting-row">
                <div class="setting-label-group">
                  <span class="setting-label">Next Reset</span>
                  <span class="setting-description">Tokens refresh monthly at 00:00 UTC</span>
                </div>
                <div style="text-align:right; min-width:120px;">
                  <div class="metric-number emphasis" style="margin:0;">${resetDateFormatted}</div>
                  <div class="metric-trend subtle" style="margin:0;">${daysUntilReset} days left</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
