import { getCurrentScreen, setCurrentScreen } from './state.js';
import { renderLoginScreen } from './screens/login.js';
import { renderSignupScreen } from './screens/signup.js';
import { renderHomeScreen } from './screens/home.js';
import { renderTokenScreen } from './screens/tokens.js';
import { renderSettingsScreen } from './screens/settings.js';
import { renderVoiceCloneScreen } from './screens/voice-clone.js';
import { renderRoutineSelectionScreen } from './screens/routine-selection.js';
import { setupEventListeners } from './events.js';

export function renderScreen() {
  const app = document.querySelector('#app');
  switch (getCurrentScreen()) {
    case 'login':
      app.innerHTML = renderLoginScreen();
      break;
    case 'signup':
      app.innerHTML = renderSignupScreen();
      break;
    case 'home':
      app.innerHTML = renderHomeScreen();
      break;
    case 'tokens':
      app.innerHTML = renderTokenScreen();
      break;
    case 'settings':
      app.innerHTML = renderSettingsScreen();
      break;
    case 'voice-clone':
      app.innerHTML = renderVoiceCloneScreen();
      break;
    case 'routine-selection':
      app.innerHTML = renderRoutineSelectionScreen();
      break;
  }
  setupEventListeners();
  // Apply scroll policy immediately on render
  applyScrollPolicy(getCurrentScreen());
}

export function navigateToScreen(screen) { performScreenTransition(screen); }

function performScreenTransition(targetScreen) {
  const currentContainer = getCurrentScreenContainer();
  if (currentContainer) {
    currentContainer.style.opacity = '0';
    currentContainer.style.transform = 'translateY(-20px)';
  }
  setTimeout(() => {
    setCurrentScreen(targetScreen);
    renderScreen();
  // Toggle scroll behavior using class-based lock
  applyScrollPolicy(targetScreen);
    const newContainer = getNewScreenContainer(targetScreen);
    if (newContainer) {
      newContainer.style.opacity = '0';
      newContainer.style.transform = 'translateY(20px)';
      setTimeout(() => {
        newContainer.style.opacity = '1';
        newContainer.style.transform = 'translateY(0)';
      }, 50);
    }
  }, 200);
}

function getCurrentScreenContainer() {
  const current = getCurrentScreen();
  if (['login','signup'].includes(current)) return document.getElementById('auth-card');
  if (['home','tokens','settings','voice-clone'].includes(current)) return document.querySelector('.home-container, .tokens-page, .settings-container, .voice-clone-container');
  if (current === 'routine-selection') return document.querySelector('.routine-selection-container');
  return null;
}

function applyScrollPolicy(screen) {
  const body = document.body;
  const html = document.documentElement;
  const lock = () => { body.classList.add('no-scroll'); html.classList.add('no-scroll'); body.classList.remove('scroll-enabled'); };
  const unlock = () => { body.classList.remove('no-scroll'); html.classList.remove('no-scroll'); };
  // screens that should be scrollable
  const scrollable = ['settings', 'voice-clone', 'routine-selection'];
  if (scrollable.includes(screen)) {
    unlock();
    body.classList.add('scroll-enabled');
  } else {
    lock();
  }
}

function getNewScreenContainer(screen) {
  if (['login','signup'].includes(screen)) return document.getElementById('auth-card');
  if (screen === 'home') return document.querySelector('.home-container');
  if (screen === 'tokens') return document.querySelector('.tokens-page');
  if (screen === 'settings') return document.querySelector('.settings-container');
  if (screen === 'voice-clone') return document.querySelector('.voice-clone-container');
  if (screen === 'routine-selection') return document.querySelector('.routine-selection-container');
  return null;
}
