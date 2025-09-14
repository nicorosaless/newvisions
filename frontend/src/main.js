import './style.css';
import { renderScreen, navigateToScreen } from './navigation.js';
import { setCurrentScreen } from './state.js';

// Function to detect if app is running as PWA
function isPWA() {
  // Check if app is in standalone mode (installed as PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS Safari standalone mode
  const isIOSStandalone = window.navigator.standalone === true;
  
  // Check if launched from home screen on Android
  const isAndroidStandalone = document.referrer.startsWith('android-app://');
  
  return isStandalone || isIOSStandalone || isAndroidStandalone;
}

// Function to detect if running in supported PWA environment
function isPWAEnvironment() {
  // Check if it's a mobile device or tablet
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check if it's a desktop with PWA support
  const isDesktopPWASupported = 'serviceWorker' in navigator && window.matchMedia;
  
  return isMobile || isDesktopPWASupported;
}

async function initializeApp() {
  // First check if the app should show PWA installation screen
  if (isPWAEnvironment() && !isPWA()) {
    console.log('App accessed via browser, showing PWA installation guide');
    setCurrentScreen('pwa-install');
    renderScreen();
    return;
  }
  
  console.log('App running as PWA or in non-PWA environment, proceeding normally');
  
  // Check if user is already logged in via cookie, but respect sign-out preference
  const userId = getCookieValue('user_id') || localStorage.getItem('user_id');
  const signedOut = localStorage.getItem('signed_out') === 'true';
  
  console.log('App init - userId:', userId, 'signedOut:', signedOut);
  console.log('Cookie value:', getCookieValue('user_id'));
  console.log('localStorage user_id:', localStorage.getItem('user_id'));
  console.log('localStorage signed_out:', localStorage.getItem('signed_out'));
  
  // If user explicitly signed out, ALWAYS go to login regardless of cookies/localStorage
  if (signedOut) {
    console.log('User signed out previously, going to login');
    setCurrentScreen('login');
  } else if (userId) {
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
    console.log('No valid session found, going to login');
    setCurrentScreen('login');
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
  console.log('Signing out user...');
  
  // Clear all possible cookie variations - be very thorough
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name === 'user_id') {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
      break;
    }
  }
  
  // Clear localStorage completely for user data
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  localStorage.removeItem('credits');
  
  // Set sign-out flag to remember the user's choice - this is the key mechanism
  localStorage.setItem('signed_out', 'true');
  console.log('Sign-out flag set, localStorage now:', localStorage.getItem('signed_out'));
  console.log('Cookie after clearing:', getCookieValue('user_id'));
  console.log('localStorage user_id after clearing:', localStorage.getItem('user_id'));
  
  // Reset app state
  setCurrentScreen('login');
  
  // Re-render to login screen
  renderScreen();
}

// Fallback global for inline onclick
window.handleCreditsClick = function() { navigateToScreen('tokens'); };

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

initializeApp();
