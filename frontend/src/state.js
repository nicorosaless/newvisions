// Centralized state management
let currentScreen = 'login'; // default
let routineType = null; // stores the type of routine for text-input screens
let routineValue = null; // stores the value/selection for the routine

// User credits (char usage) fetched from backend meta endpoint
let userCredits = {
  charCount: null,      // null means not loaded yet
  monthlyLimit: null,
  resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
};

export function getCurrentScreen() { return currentScreen; }
export function setCurrentScreen(screen) { currentScreen = screen; }
export function getUserCredits() { return { ...userCredits }; }
export function setUserCredits(charCount, monthlyLimit) {
  if (typeof charCount === 'number') userCredits.charCount = charCount;
  if (typeof monthlyLimit === 'number') userCredits.monthlyLimit = monthlyLimit;
}
export function getRoutineType() { return routineType; }
export function setRoutineType(type) { routineType = type; }
export function getRoutineValue() { return routineValue; }
export function setRoutineValue(value) { routineValue = value; }
