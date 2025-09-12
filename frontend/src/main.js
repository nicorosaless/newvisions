import './style.css';
import { renderScreen, navigateToScreen } from './navigation.js';

function initializeApp() { renderScreen(); }

// Fallback global for inline onclick
window.handleCreditsClick = function() { navigateToScreen('tokens'); };

initializeApp();
