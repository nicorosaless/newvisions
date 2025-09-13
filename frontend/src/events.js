import { navigateToScreen } from './navigation.js';
import { getCurrentScreen, getRoutineType } from './state.js';
import { handleLogin } from './screens/login.js';
import { handleSignup } from './screens/signup.js';
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
  if (currentScreen === 'settings') {
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
    { id: 'logout-btn', action: () => navigateToScreen('login') },
    { id: 'test-btn', action: () => navigateToScreen('home') },
    { id: 'back-to-home', action: () => navigateToScreen('home') },
    { id: 'back-to-settings', action: () => navigateToScreen('settings') },
    { id: 'back-to-routine-selection', action: () => navigateToScreen('routine-selection') },
    { id: 'back-to-routine', action: () => navigateToScreen('routine-selection') }
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
    { id: 'perform-btn', action: () => navigateToScreen('routine-selection') },
    { id: 'tutorial-btn', action: () => showComingSoonAlert('Tutorial functionality') },
    { id: 'settings-btn', action: () => navigateToScreen('settings') }
  ];
  actionButtons.forEach(({ id, action }) => {
    const button = document.getElementById(id);
    if (button) button.addEventListener('click', action);
  });
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
