import { getTokenData } from '../state.js';

export function renderHomeScreen() {
  const tokenInfo = getTokenData();
  return `
    <div class="home-container">
      <div class="home-header">
        <h1>Visions</h1>
        <p>Welcome back</p>
        <button class="credits-button" id="credits-btn" onclick="handleCreditsClick()">
          <span class="credits-text">${tokenInfo.used}/${tokenInfo.total}</span>
          <span class="credits-label">Credits</span>
        </button>
      </div>
      <div class="home-content">
        <button class="home-button primary large" id="perform-btn">
          <div class="button-content">
            <span class="button-title">Perform</span>
            <span class="button-subtitle">Select the routine</span>
          </div>
          <div class="button-arrow">→</div>
        </button>
        <div class="home-secondary-buttons">
          <button class="home-button secondary" id="tutorial-btn">
            <div class="button-content"><span class="button-title">Tutorial</span></div>
            <div class="button-arrow">→</div>
          </button>
          <button class="home-button secondary" id="settings-btn">
            <div class="button-content"><span class="button-title">Settings</span></div>
            <div class="button-arrow">→</div>
          </button>
        </div>
      </div>
      <div class="home-footer">
        <button type="button" class="signout-button" id="logout-btn">Sign Out</button>
      </div>
    </div>`;
}
