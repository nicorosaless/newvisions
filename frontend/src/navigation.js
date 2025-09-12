import { getCurrentScreen, setCurrentScreen } from './state.js';
import { renderLoginScreen } from './screens/login.js';
import { renderSignupScreen } from './screens/signup.js';
import { renderHomeScreen } from './screens/home.js';
import { renderTokenScreen } from './screens/tokens.js';
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
    if (targetScreen === 'tokens') {
      document.body.classList.add('scroll-enabled');
    } else {
      document.body.classList.remove('scroll-enabled');
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
  if (['home','tokens'].includes(current)) return document.querySelector('.home-container');
  return null;
}

function getNewScreenContainer(screen) {
  if (['login','signup'].includes(screen)) return document.getElementById('auth-card');
  if (['home','tokens'].includes(screen)) return document.querySelector('.home-container');
  return null;
}
