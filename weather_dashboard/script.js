// script.js

// API Endpoints for Open-Meteo
const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements - Search
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const submitBtn = searchForm.querySelector('.search-button');

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

/**
 * Listen for form submission to trigger the weather fetch
 */
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const city = cityInput.value.trim();
    if (!city) return;

    await fetchWeatherData(city);
});

/**
 * Main function to fetch weather data.
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
