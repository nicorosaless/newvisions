import { getCurrentScreen, setCurrentScreen } from './state.js';
import { renderLoginScreen } from './screens/login.js';
import { renderSignupScreen } from './screens/signup.js';
import { renderHomeScreen } from './screens/home.js';
import { renderTokenScreen } from './screens/tokens.js';
import { renderSettingsScreen } from './screens/settings.js';
import { renderVoiceCloneScreen } from './screens/voice-clone.js';
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
  }
  setupEventListeners();
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
    // Toggle scroll behavior for tokens screen
    if (targetScreen === 'tokens' || targetScreen === 'settings' || targetScreen === 'voice-clone') {
      document.body.classList.add('scroll-enabled');
      console.log('Added scroll-enabled class for screen:', targetScreen);
    } else {
      document.body.classList.remove('scroll-enabled');
      console.log('Removed scroll-enabled class for screen:', targetScreen);
    }
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
  if (['home','tokens','settings','voice-clone'].includes(current)) return document.querySelector('.home-container, .settings-container, .voice-clone-container');
  return null;
}

function getNewScreenContainer(screen) {
  if (['login','signup'].includes(screen)) return document.getElementById('auth-card');
  if (['home','tokens'].includes(screen)) return document.querySelector('.home-container');
  if (screen === 'settings') return document.querySelector('.settings-container');
  if (screen === 'voice-clone') return document.querySelector('.voice-clone-container');
  return null;
}
