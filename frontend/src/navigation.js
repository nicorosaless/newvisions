import { getCurrentScreen, setCurrentScreen, getRoutineType, setRoutineType, getRoutineValue, setRoutineValue } from './state.js';
import { renderLoginScreen } from './screens/login.js';
import { renderSignupScreen } from './screens/signup.js';
import { renderResetPasswordScreen } from './screens/reset-password.js';
import { renderHomeScreen } from './screens/home.js';
import { renderTokenScreen } from './screens/tokens.js';
import { renderSettingsScreen } from './screens/settings.js';
import { renderVoiceCloneScreen } from './screens/voice-clone.js';
import { renderRoutineSelectionScreen } from './screens/routine-selection.js';
import { renderTextInputRoutineScreen } from './screens/text-input-routine.js';
import { renderCardsRoutineScreen } from './screens/cards-routine.js';
import { renderNumbersRoutineScreen } from './screens/numbers-routine.js';
import { renderStarSignsRoutineScreen } from './screens/star-signs-routine.js';
import { renderVoiceRecordingScreen } from './screens/voice-recording.js';
import { renderPWAInstallScreen } from './screens/pwa-install.js';
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
    case 'reset-password':
      app.innerHTML = renderResetPasswordScreen();
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
    case 'text-input-routine':
      app.innerHTML = renderTextInputRoutineScreen(getRoutineType());
      break;
    case 'cards-routine':
      app.innerHTML = renderCardsRoutineScreen();
      break;
    case 'numbers-routine':
      app.innerHTML = renderNumbersRoutineScreen();
      break;
    case 'star-signs-routine':
      app.innerHTML = renderStarSignsRoutineScreen();
      break;
    case 'voice-recording':
      app.innerHTML = renderVoiceRecordingScreen(getRoutineType(), getRoutineValue());
      break;
    case 'pwa-install':
      app.innerHTML = renderPWAInstallScreen();
      break;
  }
  setupEventListeners();
  // Apply scroll policy immediately on render
  applyScrollPolicy(getCurrentScreen());
}

export function navigateToScreen(screen, routineType = null, routineValue = null) { 
  if (routineType) {
    setRoutineType(routineType);
  }
  if (routineValue) {
    setRoutineValue(routineValue);
  }
  performScreenTransition(screen); 
}

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
  if (['login','signup','reset-password'].includes(current)) return document.getElementById('auth-card');
  if (['home','tokens','settings','voice-clone'].includes(current)) return document.querySelector('.home-container, .tokens-page, .settings-container, .voice-clone-container');
  if (current === 'routine-selection') return document.querySelector('.routine-selection-container');
  if (current === 'text-input-routine') return document.querySelector('.text-input-routine-container');
  if (current === 'cards-routine') return document.querySelector('.cards-routine-container');
  if (current === 'numbers-routine') return document.querySelector('.numbers-routine-container');
  if (current === 'star-signs-routine') return document.querySelector('.star-signs-routine-container');
  if (current === 'voice-recording') return document.querySelector('.voice-recording-container');
  return null;
}

function applyScrollPolicy(screen) {
  const body = document.body;
  const html = document.documentElement;
  const lock = () => { body.classList.add('no-scroll'); html.classList.add('no-scroll'); body.classList.remove('scroll-enabled'); };
  const unlock = () => { body.classList.remove('no-scroll'); html.classList.remove('no-scroll'); };
  // screens that should be scrollable
  const scrollable = ['settings', 'voice-clone', 'routine-selection', 'text-input-routine', 'cards-routine', 'numbers-routine', 'star-signs-routine', 'voice-recording'];
  if (scrollable.includes(screen)) {
    unlock();
    body.classList.add('scroll-enabled');
  } else {
    lock();
  }
}

function getNewScreenContainer(screen) {
  if (['login','signup','reset-password'].includes(screen)) return document.getElementById('auth-card');
  if (screen === 'home') return document.querySelector('.home-container');
  if (screen === 'tokens') return document.querySelector('.tokens-page');
  if (screen === 'settings') return document.querySelector('.settings-container');
  if (screen === 'voice-clone') return document.querySelector('.voice-clone-container');
  if (screen === 'routine-selection') return document.querySelector('.routine-selection-container');
  if (screen === 'text-input-routine') return document.querySelector('.text-input-routine-container');
  if (screen === 'cards-routine') return document.querySelector('.cards-routine-container');
  if (screen === 'numbers-routine') return document.querySelector('.numbers-routine-container');
  if (screen === 'star-signs-routine') return document.querySelector('.star-signs-routine-container');
  if (screen === 'voice-recording') return document.querySelector('.voice-recording-container');
  return null;
}
