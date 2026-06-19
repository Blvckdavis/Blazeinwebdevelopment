// script.js

// ============================================================
// API Endpoints for Open-Meteo (no API key required)
// ============================================================
const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// ============================================================
// DOM Elements - Search
// ============================================================
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const submitBtn = searchForm.querySelector('.search-button');

// DOM Elements - Autocomplete
const autocompleteList = document.getElementById('autocomplete-list');

// DOM Elements - States
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherCard = document.getElementById('weather-card');

// DOM Elements - Weather Data
const elCityName = document.getElementById('city-name');
const elWeatherDate = document.getElementById('weather-date');
const elWeatherIcon = document.getElementById('weather-icon');
const elTempValue = document.getElementById('temp-value');
const elWeatherDesc = document.getElementById('weather-desc');
const elFeelsLike = document.getElementById('feels-like');
const elHumidity = document.getElementById('humidity');
const elWindSpeed = document.getElementById('wind-speed');
const elPressure = document.getElementById('pressure');


// ============================================================
// ============================================================
//
//   AUTOCOMPLETE MODULE — Debounced City Search Dropdown
//
// ============================================================
// ============================================================
//
// SECTION A: WHAT IS DEBOUNCING? (SIWES EDUCATIONAL)
// ============================================================
//
// Debouncing is a performance optimization technique that DELAYS
// the execution of a function until a specified "quiet period"
// has elapsed since the LAST time it was invoked.
//
// WHY IS IT NECESSARY HERE?
// -------------------------
// When a user types "Lagos" into the search box, the 'input'
// event fires on EVERY SINGLE KEYSTROKE:
//
//   Keystroke 1: "L"       → input event fires
//   Keystroke 2: "La"      → input event fires
//   Keystroke 3: "Lag"     → input event fires
//   Keystroke 4: "Lago"    → input event fires
//   Keystroke 5: "Lagos"   → input event fires
//
// WITHOUT debouncing, we would make 5 separate API requests to
// the Open-Meteo geocoding server — one for each keystroke.
// This is wasteful because:
//
//   1. The user hasn't finished typing yet, so the first 4
//      requests return results the user doesn't want.
//   2. It floods the API server with unnecessary traffic, which
//      can get your IP rate-limited or banned.
//   3. It wastes the user's bandwidth and battery.
//   4. Responses may arrive out of order (race condition), causing
//      the dropdown to show results for "La" instead of "Lagos".
//
// WITH debouncing (set to 350ms), we WAIT for the user to PAUSE
// typing for 350 milliseconds before making the API call.
// In practice, this means only ONE request is made — for "Lagos"
// — because each new keystroke resets the 350ms timer.
//
// HOW IT WORKS (step by step):
// ----------------------------
//   1. User presses "L" → we schedule an API call in 350ms.
//   2. User presses "a" (within 350ms) → we CANCEL the previous
//      timer and schedule a NEW one for 350ms from now.
//   3. User presses "g" → same thing, cancel and reschedule.
//   4. User presses "o" → cancel and reschedule.
//   5. User presses "s" → cancel and reschedule.
//   6. User STOPS typing → 350ms passes with no new keystrokes
//      → the timer fires → the API call is made for "Lagos".
//
// The key JavaScript functions used:
//   - setTimeout(fn, delay) — schedules fn to run after delay ms.
//     Returns a numeric timer ID.
//   - clearTimeout(timerId) — cancels a previously scheduled timer.
//     If the timer already fired, clearTimeout does nothing (safe).
//
// ============================================================

/**
 * DEBOUNCE_DELAY — The number of milliseconds to wait after the
 * user's LAST keystroke before firing the API request.
 *
 * 350ms is a good balance: fast enough to feel responsive,
 * slow enough to avoid unnecessary requests. Values between
 * 250-500ms are standard in production autocomplete widgets.
 *
 * @type {number}
 */
const DEBOUNCE_DELAY = 350;

/**
 * debounceTimer — Holds the ID of the currently scheduled timer.
 * We need to store this so we can cancel (clearTimeout) the
 * previous timer whenever a new keystroke arrives.
 *
 * Initially null because no timer has been set yet.
 *
 * @type {number|null}
 */
let debounceTimer = null;

/**
 * activeIndex — Tracks which dropdown item is currently
 * highlighted via keyboard navigation (Arrow keys).
 * -1 means no item is highlighted (default state).
 *
 * @type {number}
 */
let activeIndex = -1;


// ============================================================
// SECTION B: THE DEBOUNCED INPUT HANDLER
// ============================================================
//
// This is the core of the debouncing technique. We attach an
// 'input' event listener to the search field. The 'input' event
// fires every time the value changes (typing, pasting, deleting).
//
// Inside, we:
//   1. clearTimeout() — cancel any previously scheduled API call.
//   2. setTimeout()   — schedule a NEW API call in DEBOUNCE_DELAY ms.
//
// This ensures only the LAST keystroke triggers an actual fetch.
// ============================================================

cityInput.addEventListener('input', function () {
    // Read the current value and remove leading/trailing whitespace.
    const query = cityInput.value.trim();

    // --- STEP 1: Cancel any previously scheduled API call ---
    // If the user typed a character 100ms ago, there's a timer
    // waiting to fire. We cancel it because the query has changed.
    clearTimeout(debounceTimer);

    // If the input is empty or too short (less than 2 characters),
    // hide the dropdown and don't bother calling the API.
    // Most city names need at least 2 characters to be meaningful.
    if (query.length < 2) {
        closeDropdown();
        return;
    }

    // --- STEP 2: Schedule a NEW API call ---
    // setTimeout returns a timer ID which we store in debounceTimer.
    // If the user types another character within 350ms, we'll
    // cancel THIS timer in Step 1 above (on the next 'input' event).
    debounceTimer = setTimeout(function () {
        // This function only runs if 350ms pass without another keystroke.
        // At this point, the user has likely finished typing (or paused),
        // so it's safe to make the API call.
        fetchCitySuggestions(query);
    }, DEBOUNCE_DELAY);
});


// ============================================================
// SECTION C: ASYNCHRONOUS FETCH — Geocoding API Call
// ============================================================
//
// This function makes the actual HTTP request to the Open-Meteo
// Geocoding API. It uses the modern fetch() API with async/await.
//
// EDUCATIONAL NOTES FOR SIWES:
// ----------------------------
// fetch() returns a Promise — an object representing a value
// that will be available in the future (when the server responds).
//
// async/await is syntactic sugar that makes Promises read like
// synchronous code:
//   - `async` before a function means it ALWAYS returns a Promise.
//   - `await` pauses execution until the Promise resolves.
//   - If the Promise rejects, `await` throws an error (caught by try/catch).
//
// The flow:
//   1. fetch(url)           → sends the HTTP GET request.
//   2. await response       → waits for the server to respond.
//   3. response.json()      → parses the JSON body (also a Promise).
//   4. await parsedData     → waits for parsing to complete.
//   5. We now have a plain JS object to work with.
//
// WHY encodeURIComponent()?
//   City names can contain special characters (e.g., "São Paulo",
//   "Zürich"). encodeURIComponent() escapes these so they're
//   safe to include in a URL query string.
//   "São Paulo" → "S%C3%A3o%20Paulo"
// ============================================================

/**
 * Fetches city suggestions from the Open-Meteo Geocoding API.
 *
 * @param {string} query - The search string typed by the user.
 */
async function fetchCitySuggestions(query) {
    try {
        // Build the API URL.
        // count=5 limits results to 5 suggestions (keeps dropdown compact).
        // language=en ensures results are in English.
        const url = `${GEO_API_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;

        // Send the HTTP GET request and wait for the response.
        const response = await fetch(url);

        // Check if the HTTP status is in the 200-299 range (success).
        // If not (e.g., 500 server error), throw an error.
        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }

        // Parse the JSON response body into a JavaScript object.
        const data = await response.json();

        // The API returns { results: [...] } if matches are found,
        // or { } (no results key) if nothing matched.
        if (data.results && data.results.length > 0) {
            renderDropdown(data.results);
        } else {
            renderNoResults();
        }

    } catch (error) {
        // Network errors (offline, DNS failure) land here.
        // We silently close the dropdown rather than showing
        // an error — the user can still submit the form manually.
        console.error('Autocomplete fetch error:', error);
        closeDropdown();
    }
}


// ============================================================
// SECTION D: DROPDOWN RENDERING (DOM Manipulation)
// ============================================================

/**
 * Renders the autocomplete dropdown with city suggestions.
 * Builds <li> elements dynamically and shows the dropdown.
 *
 * Each <li> stores the full location data (name, latitude,
 * longitude, country) in data-* attributes so we can extract
 * them when the user clicks a suggestion.
 *
 * @param {Array<Object>} results - Array of location objects from the Geocoding API.
 */
function renderDropdown(results) {
    // Clear any previous suggestions.
    autocompleteList.innerHTML = '';

    // Reset keyboard navigation index.
    activeIndex = -1;

    // Build one <li> per result.
    results.forEach(function (location, index) {
        const li = document.createElement('li');
        li.className = 'autocomplete-item';
        li.setAttribute('role', 'option');
        li.setAttribute('data-index', index);

        // -------------------------------------------------------
        // Store latitude and longitude as data attributes.
        // These will be extracted when the user selects a city.
        // -------------------------------------------------------
        li.setAttribute('data-lat', location.latitude);
        li.setAttribute('data-lon', location.longitude);
        li.setAttribute('data-name', location.name);
        li.setAttribute('data-country', location.country || '');
        li.setAttribute('data-admin1', location.admin1 || '');

        // Build the display: city name on top, region/country below.
        const citySpan = document.createElement('span');
        citySpan.className = 'autocomplete-city';
        citySpan.textContent = location.name;

        const regionSpan = document.createElement('span');
        regionSpan.className = 'autocomplete-region';
        const regionParts = [];
        if (location.admin1) regionParts.push(location.admin1);
        if (location.country) regionParts.push(location.country);
        regionSpan.textContent = regionParts.join(', ');

        li.appendChild(citySpan);
        li.appendChild(regionSpan);
        autocompleteList.appendChild(li);
    });

    // Show the dropdown.
    openDropdown();
}

/**
 * Renders a "No results found" message in the dropdown.
 */
function renderNoResults() {
    autocompleteList.innerHTML = '';
    activeIndex = -1;

    const li = document.createElement('li');
    li.className = 'autocomplete-no-results';
    li.textContent = 'No cities found';
    autocompleteList.appendChild(li);

    openDropdown();
}

/**
 * Shows the autocomplete dropdown and updates ARIA attributes.
 */
function openDropdown() {
    autocompleteList.removeAttribute('hidden');
    cityInput.setAttribute('aria-expanded', 'true');
}

/**
 * Hides the autocomplete dropdown and resets state.
 */
function closeDropdown() {
    autocompleteList.setAttribute('hidden', '');
    autocompleteList.innerHTML = '';
    cityInput.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
}


// ============================================================
// SECTION E: USER SELECTION — Click & Keyboard Handlers
// ============================================================

/**
 * EVENT DELEGATION on the dropdown list.
 * When the user clicks any <li> suggestion, we:
 *   1. Extract the city name, latitude, and longitude.
 *   2. Populate the search bar with the city name.
 *   3. Close the dropdown.
 *   4. Automatically fetch weather for the selected city.
 */
autocompleteList.addEventListener('click', function (event) {
    // Find the closest <li> with the .autocomplete-item class.
    const item = event.target.closest('.autocomplete-item');
    if (!item) return;

    selectCity(item);
});

/**
 * Selects a city from the dropdown and triggers the weather fetch.
 *
 * @param {HTMLLIElement} item - The selected autocomplete <li> element.
 */
function selectCity(item) {
    // -------------------------------------------------------
    // INTEGRATION POINT — EXTRACTING LATITUDE & LONGITUDE
    // -------------------------------------------------------
    // The latitude and longitude are stored as data attributes
    // on the <li> element. We read them here and pass them
    // directly to fetchWeatherByCoords() to skip the geocoding
    // step in the weather fetch (since we already have coords).
    //
    // item.dataset reads HTML data-* attributes:
    //   data-lat="6.4541"  → item.dataset.lat  → "6.4541"
    //   data-lon="3.3947"  → item.dataset.lon  → "3.3947"
    //
    // parseFloat() converts the string to a decimal number.
    // -------------------------------------------------------

    const cityName = item.dataset.name;
    const region = item.dataset.admin1;
    const country = item.dataset.country;
    const latitude = parseFloat(item.dataset.lat);
    const longitude = parseFloat(item.dataset.lon);

    // Populate the search input with the selected city's full name.
    const displayName = region ? `${cityName}, ${region}` : cityName;
    cityInput.value = displayName;

    // Close the dropdown.
    closeDropdown();

    // -------------------------------------------------------
    // → FETCH WEATHER using the extracted coordinates.
    //   We call fetchWeatherByCoords() directly, bypassing
    //   the geocoding step since we already have lat/lon.
    // -------------------------------------------------------
    fetchWeatherByCoords(latitude, longitude, cityName, region, country);
}

/**
 * KEYBOARD NAVIGATION — Arrow keys, Enter, and Escape.
 *
 * This lets users navigate the dropdown without a mouse:
 *   ArrowDown → highlight next item
 *   ArrowUp   → highlight previous item
 *   Enter     → select the highlighted item
 *   Escape    → close the dropdown
 */
cityInput.addEventListener('keydown', function (event) {
    // Only handle keyboard nav when the dropdown is visible.
    if (autocompleteList.hasAttribute('hidden')) return;

    const items = autocompleteList.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    switch (event.key) {
        case 'ArrowDown':
            // Prevent the cursor from moving to end of input text.
            event.preventDefault();
            // Move highlight down (wrap to top if at bottom).
            activeIndex = (activeIndex + 1) % items.length;
            updateActiveItem(items);
            break;

        case 'ArrowUp':
            event.preventDefault();
            // Move highlight up (wrap to bottom if at top).
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            updateActiveItem(items);
            break;

        case 'Enter':
            // If an item is highlighted, select it instead of submitting the form.
            if (activeIndex >= 0 && activeIndex < items.length) {
                event.preventDefault();
                selectCity(items[activeIndex]);
            }
            // If no item is highlighted, let the form submit normally.
            break;

        case 'Escape':
            closeDropdown();
            break;
    }
});

/**
 * Updates the visual highlight on dropdown items for keyboard navigation.
 *
 * @param {NodeListOf<HTMLLIElement>} items - All autocomplete list items.
 */
function updateActiveItem(items) {
    // Remove 'active' class from all items.
    items.forEach(function (item) {
        item.classList.remove('active');
    });

    // Add 'active' class to the currently highlighted item.
    if (activeIndex >= 0 && activeIndex < items.length) {
        items[activeIndex].classList.add('active');
        // Ensure the highlighted item is visible if the list scrolls.
        items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
}

/**
 * CLOSE ON OUTSIDE CLICK — Hide the dropdown when the user
 * clicks anywhere outside the search wrapper.
 */
document.addEventListener('click', function (event) {
    const searchWrapper = document.querySelector('.search-wrapper');
    // If the click target is NOT inside the search wrapper, close.
    if (!searchWrapper.contains(event.target)) {
        closeDropdown();
    }
});


// ============================================================
// ============================================================
//
//   EXISTING WEATHER DASHBOARD LOGIC (Updated)
//
// ============================================================
// ============================================================

/**
 * Listen for form submission to trigger the weather fetch.
 * This handles the case where the user types a city and presses
 * Enter WITHOUT selecting from the autocomplete dropdown.
 */
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Close any open autocomplete dropdown first.
    closeDropdown();

    const city = cityInput.value.trim();
    if (!city) return;

    await fetchWeatherData(city);
});

/**
 * Main function to fetch weather data BY CITY NAME.
 * Open-Meteo requires coordinates, so this runs in two steps:
 * 1. Geocoding: Convert the city string into Latitude/Longitude.
 * 2. Weather: Fetch current weather using those coordinates.
 *
 * @param {string} city - The city name entered by the user
 */
async function fetchWeatherData(city) {
    // UI State: Show the loading spinner
    showLoading();

    try {
        // --- Step 1: Geocoding ---
        // Fetch matching locations for the given city name
        const geoResponse = await fetch(`${GEO_API_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);

        if (!geoResponse.ok) {
            throw new Error(`Geocoding failed with status: ${geoResponse.status}`);
        }

        const geoData = await geoResponse.json();

        // If the API returns no results, the city wasn't found
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('CITY_NOT_FOUND');
        }

        const location = geoData.results[0];

        // --- Step 2: Weather Data ---
        // Request the specific current weather variables we need from Open-Meteo using the coordinates
        const weatherUrl = `${WEATHER_API_URL}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error(`Weather API failed with status: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();

        // --- Step 3: Update UI ---
        updateWeatherUI(location, weatherData.current);

    } catch (error) {
        console.error('Data fetching error:', error);

        // Determine the user-friendly error message based on what failed
        let message = 'Failed to fetch weather data. Please check your internet connection and try again.';

        if (error.message === 'CITY_NOT_FOUND') {
            message = `We couldn't find a city named "${city}". Please check the spelling.`;
        }

        // UI State: Show the error message in the DOM
        showError(message);
    }
}

/**
 * Fetch weather data BY COORDINATES — called when the user selects
 * a city from the autocomplete dropdown (we already have lat/lon).
 *
 * This skips the geocoding step entirely, making the weather
 * fetch faster and more accurate.
 *
 * @param {number} latitude  - The city's latitude from the Geocoding API.
 * @param {number} longitude - The city's longitude from the Geocoding API.
 * @param {string} name      - The city's name (for display).
 * @param {string} admin1    - The city's region/state (for display).
 * @param {string} country   - The city's country (for display).
 */
async function fetchWeatherByCoords(latitude, longitude, name, admin1, country) {
    showLoading();

    try {
        const weatherUrl = `${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error(`Weather API failed with status: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();

        // Build a location-like object to reuse the existing UI updater.
        const location = { name, admin1, country, latitude, longitude };
        updateWeatherUI(location, weatherData.current);

    } catch (error) {
        console.error('Weather fetch error:', error);
        showError('Failed to fetch weather data. Please check your internet connection.');
    }
}

/**
 * Maps the data from both APIs onto the DOM elements
 *
 * @param {Object} location - From the Geocoding API (name, country, admin1)
 * @param {Object} currentData - From the Weather API (temperature, weather_code, etc.)
 */
function updateWeatherUI(location, currentData) {
    // Hide loading/error states, show the main card
    loadingEl.hidden = true;
    errorEl.hidden = true;
    weatherCard.hidden = false;
    submitBtn.disabled = false;

    // Display City Name with Region/State (if available) and Country
    const region = location.admin1 ? `${location.admin1}, ` : '';
    elCityName.textContent = `${location.name}, ${region}${location.country}`;

    // Format the timestamp provided by the API
    const date = new Date(currentData.time);
    const options = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    elWeatherDate.textContent = date.toLocaleDateString(undefined, options);

    // Map the WMO numeric weather code to a description, icon, and theme
    const weatherInfo = interpretWeatherCode(currentData.weather_code);

    // Apply dynamic theme to the body
    document.body.className = weatherInfo.theme;

    elWeatherIcon.src = weatherInfo.iconUrl;
    elWeatherIcon.alt = weatherInfo.description;

    elTempValue.textContent = `${Math.round(currentData.temperature_2m)}°C`;
    elWeatherDesc.textContent = weatherInfo.description;

    // Map the current details
    elFeelsLike.textContent = `${Math.round(currentData.apparent_temperature)}°C`;
    elHumidity.textContent = `${currentData.relative_humidity_2m}%`;
    elWindSpeed.textContent = `${currentData.wind_speed_10m} km/h`;
    elPressure.textContent = `${Math.round(currentData.surface_pressure)} hPa`;

    // Reset the search input
    cityInput.value = '';
    cityInput.blur();
}

/**
 * Helper function: Open-Meteo returns numeric WMO Weather Interpretation Codes.
 * This function translates those codes into human-readable descriptions and maps them
 * to open-source SVG icons (Bootstrap Icons).
 *
 * @param {number} code - The WMO Weather Code
 * @returns {Object} { description: string, iconUrl: string }
 */
function interpretWeatherCode(code) {
    let description = 'Unknown';
    let iconName = 'cloud-sun-fill'; // Default fallback
    let theme = 'theme-cloudy'; // Default theme

    if (code === 0) {
        description = 'Clear sky';
        iconName = 'sun-fill';
        theme = 'theme-clear';
    } else if (code === 1) {
        description = 'Mainly clear';
        iconName = 'sun-fill';
        theme = 'theme-clear';
    } else if (code === 2) {
        description = 'Partly cloudy';
        iconName = 'cloud-sun-fill';
        theme = 'theme-cloudy';
    } else if (code === 3) {
        description = 'Overcast';
        iconName = 'cloud-fill';
        theme = 'theme-cloudy';
    } else if (code === 45 || code === 48) {
        description = 'Fog';
        iconName = 'cloud-fog2-fill';
        theme = 'theme-cloudy';
    } else if (code >= 51 && code <= 57) {
        description = 'Drizzle';
        iconName = 'cloud-drizzle-fill';
        theme = 'theme-rain';
    } else if (code >= 61 && code <= 67) {
        description = 'Rain';
        iconName = 'cloud-rain-fill';
        theme = 'theme-rain';
    } else if (code >= 71 && code <= 77) {
        description = 'Snow';
        iconName = 'cloud-snow-fill';
        theme = 'theme-snow';
    } else if (code >= 80 && code <= 82) {
        description = 'Rain showers';
        iconName = 'cloud-rain-heavy-fill';
        theme = 'theme-rain';
    } else if (code === 85 || code === 86) {
        description = 'Snow showers';
        iconName = 'cloud-snow-fill';
        theme = 'theme-snow';
    } else if (code >= 95 && code <= 99) {
        description = 'Thunderstorm';
        iconName = 'cloud-lightning-rain-fill';
        theme = 'theme-rain';
    }

    // Using free Bootstrap Icons SVGs via jsDelivr CDN
    const iconUrl = `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/icons/${iconName}.svg`;

    return { description, iconUrl, theme };
}

/**
 * UI Helper: Shows the loading spinner and disables the button to prevent duplicate clicks
 */
function showLoading() {
    weatherCard.hidden = true;
    errorEl.hidden = true;
    loadingEl.hidden = false;
    submitBtn.disabled = true;
}

/**
 * UI Helper: Shows the error container with a dynamic message
 * @param {string} message - The error message to display
 */
function showError(message) {
    weatherCard.hidden = true;
    loadingEl.hidden = true;
    errorEl.hidden = false;
    errorText.textContent = message;
    submitBtn.disabled = false;
}

