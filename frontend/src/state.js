// Centralized state management
let currentScreen = 'login'; // default

// Mock token data (could later be fetched from API)
const tokenData = {
  used: 1234,
  total: 4000,
  resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
};

export function getCurrentScreen() { return currentScreen; }
export function setCurrentScreen(screen) { currentScreen = screen; }
export function getTokenData() { return { ...tokenData }; }
