import { getUserCredits, setUserCredits } from '../state.js';

// Helper for dynamic credits update after render
async function loadUserCredits() {
  try {
    const userId = getUserId();
    if (!userId) return;
    const { getUserMeta } = await import('../api.ts');
    const meta = await getUserMeta(userId);
    const el = document.querySelector('.credits-text');
    if (el && meta) {
      el.textContent = `${meta.charCount}/${meta.monthlyLimit}`;
    }
  } catch (err) {
    console.warn('Could not load user credits', err);
  }
}

function getUserId() {
  // Try cookie first
  const match = document.cookie.match(/(?:^|; )user_id=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  try { return localStorage.getItem('user_id'); } catch (_) { return null; }
}

export function renderHomeScreen() {
  const credits = getUserCredits();
  const used = credits.charCount !== null ? credits.charCount : '...';
  const total = credits.monthlyLimit !== null ? credits.monthlyLimit : '...';
  return `
    <div class="home-container">
      <div class="home-header">
        <h1>Visions</h1>
        <p>Welcome back</p>
        <button class="credits-button" id="credits-btn" onclick="handleCreditsClick()">
          <span class="credits-text">${used}/${total}</span>
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
          <button type="button" class="signout-button" id="logout-btn">Sign Out</button>
        </div>
      </div>
    </div>`;
}

// After DOM insertion, events.js calls setupEventListeners; we can schedule async credit load
// We rely on microtask to ensure element exists
queueMicrotask(() => loadUserCredits());
