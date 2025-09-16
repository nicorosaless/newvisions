import { navigateToScreen } from './navigation.js';
import { getCurrentScreen, getRoutineType } from './state.js';
import { handleLogin } from './screens/login.js';
import { handleSignup } from './screens/signup.js';
import { setupResetPasswordEventListeners } from './screens/reset-password.js';
import { setupSettingsEventListeners } from './screens/settings.js';
import { setupVoiceCloneEventListeners } from './screens/voice-clone.js';
import { setupRoutineSelectionEventListeners } from './screens/routine-selection.js';
import { setupTextInputRoutineEventListeners } from './screens/text-input-routine.js';
import { setupCardsRoutineEventListeners } from './screens/cards-routine.js';
import { setupNumbersRoutineEventListeners } from './screens/numbers-routine.js';
import { setupStarSignsRoutineEventListeners } from './screens/star-signs-routine.js';
import { setupVoiceRecordingEventListeners } from './screens/voice-recording.js';

export function setupEventListeners() {
  setupNavigationListeners();
  setupFormListeners();
  setupActionListeners();
  setupInputAnimations();
  
  // Setup screen-specific listeners
  const currentScreen = getCurrentScreen();
  if (currentScreen === 'reset-password') {
    setupResetPasswordEventListeners();
  } else if (currentScreen === 'settings') {
    setupSettingsEventListeners();
  } else if (currentScreen === 'voice-clone') {
    setupVoiceCloneEventListeners();
  } else if (currentScreen === 'routine-selection') {
    setupRoutineSelectionEventListeners();
  } else if (currentScreen === 'text-input-routine') {
    setupTextInputRoutineEventListeners(getRoutineType());
  } else if (currentScreen === 'cards-routine') {
    setupCardsRoutineEventListeners();
  } else if (currentScreen === 'numbers-routine') {
    setupNumbersRoutineEventListeners();
  } else if (currentScreen === 'star-signs-routine') {
    setupStarSignsRoutineEventListeners();
  } else if (currentScreen === 'voice-recording') {
    setupVoiceRecordingEventListeners();
  }
}

function setupNavigationListeners() {
  const navigationButtons = [
    { id: 'show-signup', action: () => navigateToScreen('signup') },
    { id: 'show-login', action: () => navigateToScreen('login') },
    { id: 'forgot-password', action: () => navigateToScreen('reset-password') },
    { id: 'logout-btn', action: () => { import('./main.js').then(m => m.signOut()); } },
    { id: 'back-to-home', action: () => navigateToScreen('home') },
    { id: 'back-to-settings', action: () => navigateToScreen('settings') },
    { id: 'back-to-routine-selection', action: () => navigateToScreen('routine-selection') },
    { id: 'back-to-routine', action: () => navigateToScreen('routine-selection') },
    { id: 'edit-recordings', action: () => navigateToScreen('home') },
    { id: 'continue-in-browser', action: () => { try { localStorage.setItem('skip_pwa_prompt', 'true'); } catch (_) {} navigateToScreen('home'); } }
  ];
  navigationButtons.forEach(({ id, action }) => {
    const button = document.getElementById(id);
    if (button) button.addEventListener('click', action);
  });
  const creditsBtn = document.getElementById('credits-btn');
  if (creditsBtn) {
    creditsBtn.addEventListener('click', () => navigateToScreen('tokens'));
  }
}

function setupFormListeners() {
  const forms = [
    { id: 'login-form', handler: handleLogin },
    { id: 'signup-form', handler: handleSignup }
  ];
  forms.forEach(({ id, handler }) => {
    const form = document.getElementById(id);
    if (form) form.addEventListener('submit', handler);
  });
}

function setupActionListeners() {
  const actionButtons = [
    { id: 'tutorial-btn', action: () => showComingSoonAlert('Tutorial functionality') },
    { id: 'settings-btn', action: () => navigateToScreen('settings') }
  ];
  actionButtons.forEach(({ id, action }) => {
    const button = document.getElementById(id);
    if (button) button.addEventListener('click', action);
  });

  // Perform button gating by voice sample presence (must have sample before performing)
  const performBtn = document.getElementById('perform-btn');
  if (performBtn) {
    performBtn.addEventListener('click', async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          alert('Please log in again.');
          navigateToScreen('login');
          return;
        }
        const { apiClient } = await import('./api.ts');
        const meta = await apiClient.getUserVoiceMeta(userId).catch(() => null);
        if (!meta) {
          alert('Unable to verify voice status. Try again.');
          return;
        }
        if (!meta.hasSample) {
          if (confirm('You must record a 30–60s voice sample before performing. Go to Settings to create it now?')) {
            navigateToScreen('settings');
          }
          return;
        }
        if (!meta.hasClone) {
          // The user has a sample but hasn't generated/assigned a voice_clone_id yet
          if (confirm('Finish generating your voice clone before performing. Go to Settings now?')) {
            navigateToScreen('settings');
          }
          return;
        }
        navigateToScreen('routine-selection');
      } catch (e) {
        console.warn('Perform gating error', e);
        alert('Error checking voice clone. Try again.');
      }
    });
  }
}

// Local helper to retrieve user id consistently (duplicated logic kept lightweight)
function getUserId() {
  const match = document.cookie.match(/(?:^|; )user_id=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  try { return localStorage.getItem('user_id'); } catch (_) { return null; }
}

function setupInputAnimations() {
  const inputs = document.querySelectorAll('.input-group input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => input.parentElement.classList.add('focused'));
    input.addEventListener('blur', () => { if (!input.value) input.parentElement.classList.remove('focused'); });
    if (input.value) input.parentElement.classList.add('focused');
  });
}

function showComingSoonAlert(feature) { alert(`${feature} coming soon!`); }

// Expose for inline onclick fallback usage
window.handleCreditsClick = function() { navigateToScreen('tokens'); };
