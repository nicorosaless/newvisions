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
  const resetDateFormatted = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `
    <div class="home-container">
      <div class="tokens-header">
        <button class="back-button" id="back-to-home">← Back</button>
        <h1>Token Usage</h1>
      </div>
      <div class="tokens-content">
        <div class="usage-overview">
          <div class="usage-circle">
            <svg class="usage-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#007AFF" stroke-width="8"
                      stroke-dasharray="${(usagePercentage * 339.29) / 100} 339.29"
                      stroke-dashoffset="0" transform="rotate(-90 60 60)"/>
            </svg>
            <div class="usage-text">
              <span class="usage-percentage">${usagePercentage}%</span>
              <span class="usage-label">Used</span>
            </div>
          </div>
        </div>
        <div class="token-stats">
          <div class="stat-card"><div class="stat-number">${usedTokens.toLocaleString()}</div><div class="stat-label">Tokens Used</div></div>
          <div class="stat-card"><div class="stat-number">${remainingTokens.toLocaleString()}</div><div class="stat-label">Remaining</div></div>
          <div class="stat-card"><div class="stat-number">${totalTokens.toLocaleString()}</div><div class="stat-label">Total Limit</div></div>
        </div>
        <div class="reset-info">
          <div class="reset-card">
            <div class="reset-title">Next Reset</div>
            <div class="reset-date">${resetDateFormatted}</div>
            <div class="reset-countdown">${daysUntilReset} days remaining</div>
            <div class="reset-note">Tokens reset on the 1st of every month</div>
          </div>
        </div>
      </div>
    </div>`;
}
