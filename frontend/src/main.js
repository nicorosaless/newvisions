import './style.css';
import { renderScreen, navigateToScreen } from './navigation.js';
import { setCurrentScreen } from './state.js';

async function initializeApp() {
  // Check if user is already logged in via cookie
  const userId = getCookieValue('user_id') || localStorage.getItem('user_id');
  
  if (userId) {
    console.log('User already logged in, skipping to home');
    setCurrentScreen('home');
    
    // Try to prefetch user credits
    try {
      const { getUserMeta } = await import('./api.ts');
      const meta = await getUserMeta(userId);
      if (meta) {
        const { setUserCredits } = await import('./state.js');
        setUserCredits(meta.charCount, meta.monthlyLimit);
      }
    } catch (e) {
      console.warn('Failed to prefetch user meta on init', e);
    }
  }
  
  renderScreen();
}

// Cookie utility function
function getCookieValue(key) {
  const name = key + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

// Fallback global for inline onclick
window.handleCreditsClick = function() { navigateToScreen('tokens'); };

initializeApp();
