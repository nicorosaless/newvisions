import { navigateToScreen } from './navigation.js';
import { getCurrentScreen } from './state.js';
import { handleLogin } from './screens/login.js';
import { handleSignup } from './screens/signup.js';

export function setupEventListeners() {
  setupNavigationListeners();
  setupFormListeners();
  setupActionListeners();
  setupInputAnimations();
}

function setupNavigationListeners() {
  const navigationButtons = [
    { id: 'show-signup', action: () => navigateToScreen('signup') },
    { id: 'show-login', action: () => navigateToScreen('login') },
    { id: 'logout-btn', action: () => navigateToScreen('login') },
    { id: 'test-btn', action: () => navigateToScreen('home') },
    { id: 'back-to-home', action: () => navigateToScreen('home') }
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
    { id: 'perform-btn', action: () => showComingSoonAlert('Perform functionality') },
    { id: 'tutorial-btn', action: () => showComingSoonAlert('Tutorial functionality') },
    { id: 'settings-btn', action: () => showComingSoonAlert('Settings functionality') }
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
