/* ==========================================================
   THEME SWITCHER — JAVASCRIPT
   
   Handles toggling between light and dark themes by
   adding/removing the `.dark-theme` class on <body>.
   
   Features:
   • Persists user preference via localStorage
   • Respects system-level prefers-color-scheme
   • Updates ARIA attributes for screen readers
   • Listens for OS-level theme changes in real time
   ========================================================== */


/**
 * ────────────────────────────────────────────────
 *  1. CONSTANTS & DOM REFERENCES
 * ────────────────────────────────────────────────
 */

/** @type {string} localStorage key for persisted theme preference */
const STORAGE_KEY = 'theme-preference';

/** @type {string} CSS class applied to <body> for dark mode */
const DARK_CLASS = 'dark-theme';

/** @type {HTMLButtonElement} The toggle switch element */
const toggleBtn = document.getElementById('theme-toggle');

/** @type {HTMLElement} The <body> element we toggle the class on */
const body = document.body;


/**
 * ────────────────────────────────────────────────
 *  2. THEME DETECTION
 * ────────────────────────────────────────────────
 *  Determines the initial theme on page load.
 *  Priority order:
 *    1. Previously saved user preference (localStorage)
 *    2. Operating system / browser preference
 *    3. Default: light theme
 */

/**
 * Checks if the user's OS or browser prefers dark mode.
 * @returns {boolean} True if the system prefers dark colour scheme.
 */
function systemPrefersDark() {
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * Reads the saved theme from localStorage.
 * @returns {'dark' | 'light' | null} The stored preference, or null.
 */
function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Determines whether dark mode should be active on load.
 * @returns {boolean} True if dark mode should be applied.
 */
function shouldUseDark() {
  const saved = getSavedTheme();

  // If the user has explicitly chosen a theme, respect it
  if (saved === 'dark') return true;
  if (saved === 'light') return false;

  // Otherwise, defer to the operating system preference
  return systemPrefersDark();
}


/**
 * ────────────────────────────────────────────────
 *  3. THEME APPLICATION
 * ────────────────────────────────────────────────
 */

/**
 * Applies or removes the dark theme class and updates
 * all related UI states (ARIA attributes, localStorage).
 *
 * @param {boolean} isDark — Whether to enable dark mode.
 * @param {boolean} [persist=true] — Whether to save to localStorage.
 */
function applyTheme(isDark, persist = true) {
  // Toggle the CSS class on <body>
  body.classList.toggle(DARK_CLASS, isDark);

  // Update the toggle button's ARIA state for accessibility
  toggleBtn.setAttribute('aria-checked', String(isDark));

  // Persist the choice so it survives page reloads
  if (persist) {
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }
}


/**
 * ────────────────────────────────────────────────
 *  4. EVENT LISTENERS
 * ────────────────────────────────────────────────
 */

/**
 * Toggle button click handler.
 * Checks current state and flips to the opposite theme.
 */
toggleBtn.addEventListener('click', () => {
  const isCurrentlyDark = body.classList.contains(DARK_CLASS);
  applyTheme(!isCurrentlyDark);
});

/**
 * Listen for OS-level theme changes in real time.
 * For example, if the user switches macOS/Windows from
 * light to dark mode while the page is open, this
 * handler will update the UI automatically — but only
 * if the user hasn't manually overridden the preference.
 */
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (event) => {
    // Only auto-follow if there's no explicit user override
    if (!getSavedTheme()) {
      applyTheme(event.matches, false);
    }
  });


/**
 * ────────────────────────────────────────────────
 *  5. INITIALISATION
 * ────────────────────────────────────────────────
 *  Apply the correct theme as soon as the script runs.
 *  Because this <script> is placed at the end of <body>,
 *  the DOM is ready — no DOMContentLoaded wrapper needed.
 */

applyTheme(shouldUseDark());


/* ── End of script.js ── */
