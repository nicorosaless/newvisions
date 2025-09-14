import './style.css';
import { renderScreen, navigateToScreen } from './navigation.js';
import { setCurrentScreen } from './state.js';

async function initializeApp() {
  // Check if user is already logged in via cookie, but respect sign-out preference
  const userId = getCookieValue('user_id') || localStorage.getItem('user_id');
  const signedOut = localStorage.getItem('signed_out') === 'true';
  
  if (userId && !signedOut) {
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
  } else {
    // Clear sign-out flag if user manually logs in again
    if (signedOut && userId) {
      localStorage.removeItem('signed_out');
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

// Function to clear user session (sign out)
export function signOut() {
  // Clear cookie by setting expiration to past date
  document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
  
  // Clear localStorage as fallback
  localStorage.removeItem('user_id');
  
  // Set sign-out flag to remember the user's choice
  localStorage.setItem('signed_out', 'true');
  
  // Reset app state
  setCurrentScreen('login');
  
  // Re-render to login screen
  renderScreen();
}

// Fallback global for inline onclick
window.handleCreditsClick = function() { navigateToScreen('tokens'); };

initializeApp();
