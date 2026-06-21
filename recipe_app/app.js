/**
 * ============================================================
 * app.js — FlavorFind Recipe Discovery Application
 * ============================================================
 *
 * OVERVIEW FOR SIWES INTERNSHIP DOCUMENTATION:
 * ---------------------------------------------
 * This file powers the FlavorFind recipe discovery app. It
 * demonstrates four key front-end skills:
 *
 *   1. Working with Complex API Data Arrays — fetching JSON from
 *      TheMealDB, parsing the response, and extracting nested
 *      ingredient/measure pairs from a non-standard data shape.
 *
 *   2. Array-to-DOM Mapping — transforming an array of JS objects
 *      into a responsive grid of HTML cards using createElement().
 *
 *   3. Category Filtering — dynamically updating the UI by
 *      fetching new data based on the selected category without
 *      reloading the page (SPA-like behavior).
 *
 *   4. UI Modal Pattern — opening/closing a full-screen overlay
 *      by toggling CSS classes, and populating it with data.
 *
 * All code is vanilla JavaScript — no frameworks or libraries.
 *
 * ============================================================
 * SECTION 1: HOW TheMealDB API DATA IS STRUCTURED (EDUCATIONAL)
 * ============================================================
 *
 * TheMealDB returns meals in this JSON shape:
 *
 *   {
 *     "meals": [
 *       {
 *         "idMeal": "52772",
 *         "strMeal": "Teriyaki Chicken Casserole",
 *         "strCategory": "Chicken",
 *         "strArea": "Japanese",
 *         "strInstructions": "Preheat oven to 350...",
 *         "strMealThumb": "https://www.themealdb.com/images/media/meals/...",
 *         "strYoutube": "https://www.youtube.com/watch?v=...",
 *         "strIngredient1": "soy sauce",
 *         "strIngredient2": "water",
 *         ...
 *         "strIngredient20": "",
 *         "strMeasure1": "3/4 cup",
 *         "strMeasure2": "1/2 cup",
 *         ...
 *         "strMeasure20": ""
 *       }
 *     ]
 *   }
 *
 * IMPORTANT DATA QUIRK:
 *   Ingredients are NOT in an array. Instead, they're spread
 *   across 20 individually numbered properties:
 *     strIngredient1, strIngredient2, ... strIngredient20
 *     strMeasure1,    strMeasure2,    ... strMeasure20
 *
 *   Many of these will be empty strings or null (most recipes
 *   have 8-15 ingredients, not 20). Our extractIngredients()
 *   function loops through all 20 and filters out the empties.
 *
 * ============================================================
 * SECTION 2: HOW THE MODAL WORKS (EDUCATIONAL)
 * ============================================================
 *
 * The modal is a full-screen overlay that displays recipe details.
 * It lives in the HTML at all times but is hidden by default.
 *
 * OPENING THE MODAL:
 *   1. The overlay element has `opacity: 0` and `visibility: hidden`
 *      in its default CSS state.
 *   2. When we call openModal(), we:
 *      a) Remove the `hidden` attribute (so display is not none).
 *      b) Add the CSS class `open` to the overlay.
 *      c) The `open` class sets `opacity: 1` and `visibility: visible`,
 *         triggering a smooth CSS transition (fade in + slide up).
 *      d) Add `modal-open` class to <body> to prevent background scroll.
 *
 * CLOSING THE MODAL:
 *   1. Remove the `open` class → CSS transitions back to invisible.
 *   2. After the transition ends (350ms), we set `hidden` again.
 *   3. Remove `modal-open` from <body> to re-enable scrolling.
 *
 * WHY TWO STEPS (class + hidden)?
 *   - The CSS `opacity`/`visibility` transition creates the smooth
 *     animation. But `visibility: hidden` alone doesn't remove the
 *     element from the accessibility tree.
 *   - The HTML `hidden` attribute ensures screen readers ignore the
 *     modal when it's closed and prevents tab focus from entering it.
 *   - We remove `hidden` BEFORE adding `open` (so the transition
 *     plays), and add `hidden` AFTER removing `open` (so the exit
 *     transition plays before the element vanishes).
 *
 * ============================================================
 */

// ============================================================
// Constants & API Configuration
// ============================================================

/** Base URL for searching meals by name */
const SEARCH_API = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';

/** Base URL for filtering meals by category */
const CATEGORY_API = 'https://www.themealdb.com/api/json/v1/1/filter.php?c=';

/** Base URL for looking up a single meal by ID */
const LOOKUP_API = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

/**
 * Default search queries used to load an initial set of recipes.
 * We search multiple terms and merge results for variety.
 * @type {string[]}
 */
const DEFAULT_SEARCHES = ['chicken', 'beef', 'pasta', 'fish'];

/** Spoonacular API Key (used ONLY in the one-time fetch script, NOT at runtime) */
const SPOONACULAR_API_KEY = 'f4d92a0b87c04945a76aff66ad8a00f8';

// ============================================================
// DATA NORMALIZATION LAYER (HYBRID ARCHITECTURE)
// ============================================================
//
// OFFLINE-FIRST APPROACH:
// -----------------------
// To avoid burning through free-tier API quotas on every page
// load, we use an "offline-first" strategy:
//
//   1. RUN ONCE: Execute fetch_spoonacular.js via Node.js to
//      pull recipes from the live Spoonacular API.
//   2. SAVE: Copy the console output into nigerian_recipes.json.
//   3. RUNTIME: The app fetches from the LOCAL JSON file only.
//      No live API calls are made at runtime.
//
// This means our app works perfectly on localhost/Live Server
// with zero API usage. The JSON file acts as our "cache".
//
// DATA NORMALIZATION:
// -------------------
// Both TheMealDB (external API) and our local JSON (Spoonacular
// data) have different schemas. We normalize them into a single
// predictable format before passing to the UI:
//
// Our Standard Normalized Recipe Schema:
// {
//   id: string,
//   name: string,
//   category: string,
//   area: string,
//   instructions: string,
//   thumbnail: string,
//   youtube: string,
//   ingredients: Array<{ ingredient: string, measure: string }>
// }
// ============================================================

/**
 * Normalizes a messy recipe object from TheMealDB API into our standard schema.
 * Extracts the 20 flat ingredient properties into a clean array.
 *
 * @param {Object} meal - The raw meal object from TheMealDB API.
 * @returns {Object} Normalized recipe object.
 */
function normalizeMealDBRecipe(meal) {
    const ingredients = [];

    // Loop through the 20 possible ingredient slots in TheMealDB format.
    for (let i = 1; i <= 20; i++) {
        // Dynamically build the property name using bracket notation.
        const ingredient = meal['strIngredient' + i];
        const measure = meal['strMeasure' + i];

        if (ingredient && ingredient.trim()) {
            ingredients.push({
                ingredient: ingredient.trim(),
                measure: measure ? measure.trim() : ''
            });
        }
    }

    return {
        id: meal.idMeal,
        name: meal.strMeal,
        category: meal.strCategory || '',
        area: meal.strArea || '',
        instructions: meal.strInstructions || 'No instructions available.',
        thumbnail: meal.strMealThumb,
        youtube: meal.strYoutube || '',
        ingredients: ingredients
    };
}

/**
 * Normalizes a recipe from our local nigerian_recipes.json file.
 *
 * OFFLINE-FIRST ARCHITECTURE (SIWES EDUCATIONAL):
 * ------------------------------------------------
 * Our local JSON was pre-populated using a one-time Spoonacular
 * API fetch (see fetch_spoonacular.js). The data was already
 * transformed into our standard schema at fetch-time, so this
 * normalizer acts as a simple pass-through.
 *
 * WHY A PASS-THROUGH?
 *   Because we designed the JSON to match our schema from the
 *   start, no further transformation is needed. But having a
 *   normalizer function anyway is good practice — it acts as a
 *   "safety net" and documents the data contract.
 *
 * @param {Object} recipe - A recipe object from nigerian_recipes.json.
 * @returns {Object} Normalized recipe object (unchanged).
 */
function normalizeLocalRecipe(recipe) {
    // Our local JSON already matches the standard normalized schema.
    return recipe;
}

/**
 * Fetches Nigerian recipes from the LOCAL JSON file.
 *
 * OFFLINE-FIRST: This reads from nigerian_recipes.json, NOT
 * from a live API. This means zero API calls at runtime and
 * the app works perfectly on localhost/Live Server.
 *
 * @returns {Promise<Array<Object>|null>} Normalized recipes, or null on failure.
 */
async function fetchNigerianRecipes() {
    try {
        const response = await fetch('./nigerian_recipes.json');

        if (!response.ok) {
            console.error(`Local JSON fetch failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            return data.map(normalizeLocalRecipe);
        }
        return [];
    } catch (error) {
        console.error('Error fetching local Nigerian recipes:', error);
        return null;
    }
}



// ============================================================
// DOM Element References
// ============================================================

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const recipeGrid = document.getElementById('recipe-grid');
const loadingEl = document.getElementById('loading');
const errorState = document.getElementById('error-state');
const errorText = document.getElementById('error-text');
const filterButtons = document.querySelectorAll('.filter-btn');

// Modal elements
const modalOverlay = document.getElementById('recipe-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalArea = document.getElementById('modal-area');
const modalIngredients = document.getElementById('modal-ingredients');
const modalInstructions = document.getElementById('modal-instructions');
const modalYoutube = document.getElementById('modal-youtube');


// ============================================================
// Application State
// ============================================================

/**
 * Stores the currently active filter category.
 * 'all' means show all results.
 * @type {string}
 */
let currentCategory = 'all';


// ============================================================
// ============================================================
//
//   SECTION 3: FETCHING & MAPPING API DATA TO THE DOM
//
// ============================================================
// ============================================================
//
// This is the core data flow of the application:
//
//   User Action → Fetch JSON → Parse Array → Map to DOM Cards
//
// MAPPING AN ARRAY TO THE DOM (SIWES EDUCATIONAL):
// -------------------------------------------------
// After receiving the API response, we have a JavaScript array
// of meal objects (e.g., data.meals). To display these on screen,
// we need to CREATE an HTML element for each meal.
//
// The pattern is:
//   1. Clear the existing grid: grid.innerHTML = ''
//   2. Loop through the array with forEach()
//   3. For each item, call createRecipeCard(meal) which:
//      a) Creates a <div> element
//      b) Sets its classes, attributes, and inner HTML
//      c) Returns the fully built element
//   4. Append each element to the grid container
//
// This is the vanilla JS equivalent of React's .map() pattern:
//   React:   {meals.map(meal => <Card key={meal.id} {...meal} />)}
//   Vanilla: meals.forEach(meal => grid.appendChild(createCard(meal)))
//
// ============================================================

/**
 * Fetches recipes by SEARCH QUERY (meal name).
 * Called when the user submits the search form.
 *
 * @param {string} query - The search term to look up.
 */
async function searchRecipes(query) {
    showLoading();

    try {
        const response = await fetch(`${SEARCH_API}${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Check our local Nigerian recipes for matches
        const localRecipes = await fetchNigerianRecipes() || [];
        const localMatches = localRecipes.filter(meal => 
            meal.name.toLowerCase().includes(query.toLowerCase()) || 
            meal.category.toLowerCase().includes(query.toLowerCase())
        );

        let combinedMeals = [];
        if (data.meals) {
            // Normalize API data before merging
            const normalizedApiData = data.meals.map(normalizeMealDBRecipe);
            combinedMeals = [...normalizedApiData];
        }
        
        if (localMatches.length > 0) combinedMeals = [...localMatches, ...combinedMeals];

        if (combinedMeals.length === 0) {
            showError(`No recipes found for "${query}". Try another search!`);
            return;
        }

        // Map the combined array to DOM cards and display them.
        renderRecipeGrid(combinedMeals);

    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to fetch recipes. Check your internet connection.');
    }
}

/**
 * Fetches recipes by CATEGORY using the filter endpoint.
 *
 * NOTE: The filter endpoint returns LIMITED data per meal:
 *   { idMeal, strMeal, strMealThumb }
 * It does NOT include strCategory, strArea, etc.
 * So we add the category name manually.
 *
 * @param {string} category - The category name (e.g., 'Beef', 'Chicken').
 */
async function fetchByCategory(category) {
    showLoading();

    // HYBRID ARCHITECTURE: INTERCEPT NIGERIAN CATEGORY
    if (category === 'Nigerian') {
        const localRecipes = await fetchNigerianRecipes();
        if (localRecipes === null) {
            showError("Failed to load Nigerian recipes. Make sure nigerian_recipes.json exists.");
            return;
        }
        if (localRecipes.length === 0) {
            showError("No Nigerian recipes found.");
            return;
        }
        renderRecipeGrid(localRecipes);
        return;
    }

    try {
        const response = await fetch(`${CATEGORY_API}${encodeURIComponent(category)}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals) {
            showError(`No recipes found in "${category}" category.`);
            return;
        }

        // Normalize API data
        // The filter API returns less data, so we ensure the category is set
        const normalizedMeals = data.meals.map(meal => {
            const normalized = normalizeMealDBRecipe(meal);
            normalized.category = category; // Inject the category manually for the filter endpoint
            return normalized;
        });

        renderRecipeGrid(normalizedMeals);

    } catch (error) {
        console.error('Category fetch error:', error);
        showError('Failed to fetch recipes. Check your internet connection.');
    }
}

/**
 * Fetches a SINGLE meal's full details by its ID.
 * Called when a user clicks a recipe card to open the modal.
 *
 * @param {string} mealId - The unique meal ID from TheMealDB.
 */
async function fetchMealDetails(mealId) {
    // HYBRID ARCHITECTURE: INTERCEPT LOCAL NIGERIAN MEALS
    if (mealId.startsWith('nigerian-')) {
        const localRecipes = await fetchNigerianRecipes();
        if (localRecipes) {
            const localMeal = localRecipes.find(m => m.id === mealId);
            if (localMeal) {
                openModal(localMeal);
            } else {
                showError('Could not find the details for this Nigerian recipe.');
            }
        } else {
            showError('Could not load Nigerian recipe data.');
        }
        return;
    }

    try {
        const response = await fetch(`${LOOKUP_API}${mealId}`);

        if (!response.ok) {
            throw new Error(`Lookup error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals || data.meals.length === 0) {
            console.error('Meal not found:', mealId);
            return;
        }

        // Normalize and open the modal
        const normalizedMeal = normalizeMealDBRecipe(data.meals[0]);
        openModal(normalizedMeal);

    } catch (error) {
        console.error('Meal detail fetch error:', error);
    }
}

/**
 * Loads the INITIAL recipe set on page load.
 * Fetches multiple default searches and merges results
 * to show a diverse starting grid.
 */
async function loadInitialRecipes() {
    showLoading();

    try {
        // Fetch all default searches in parallel using Promise.all().
        const promises = DEFAULT_SEARCHES.map(term =>
            fetch(`${SEARCH_API}${term}`).then(res => res.json())
        );

        const results = await Promise.all(promises);

        // Merge all meal arrays into one flat array.
        let allMeals = [];
        results.forEach(data => {
            if (data.meals) {
                allMeals = allMeals.concat(data.meals);
            }
        });

        // Normalize the API meals
        let normalizedApiMeals = allMeals.map(normalizeMealDBRecipe);

        // Remove duplicate meals using Map keyed by id
        const uniqueMeals = [...new Map(normalizedApiMeals.map(m => [m.id, m])).values()];

        // Merge in our local Nigerian recipes so they appear on the homepage
        const localRecipes = await fetchNigerianRecipes() || [];
        const finalInitialList = [...uniqueMeals, ...localRecipes];

        // Shuffle for visual variety on each page load.
        const shuffled = finalInitialList.sort(() => Math.random() - 0.5);

        if (shuffled.length === 0) {
            showError('Could not load recipes. Please try again later.');
            return;
        }

        renderRecipeGrid(shuffled);

    } catch (error) {
        console.error('Initial load error:', error);
        showError('Failed to load recipes. Check your internet connection.');
    }
}


// ============================================================
// SECTION 4: RENDERING — Array-to-DOM Mapping (EDUCATIONAL)
// ============================================================
//
// This is the heart of the "mapping" pattern. We take a plain
// JavaScript array and turn it into visible HTML elements.
//
// The key concept:
//   Each object in the array represents ONE recipe.
//   Each recipe becomes ONE <div class="recipe-card"> in the DOM.
//
// Steps:
//   1. Clear the grid (remove previous cards).
//   2. For each meal object, call createRecipeCard().
//   3. createRecipeCard() builds the HTML structure using
//      document.createElement() — this is safer than innerHTML
//      because it automatically escapes user-provided strings,
//      preventing XSS attacks.
//   4. Append each finished card to the grid container.
//
// After all cards are appended, the CSS Grid layout engine
// automatically arranges them into a responsive grid.
// ============================================================

/**
 * RENDER RECIPE GRID — Maps the meals array onto DOM cards.
 *
 * This function clears the grid, then loops through the array
 * and creates one card element per meal. Each card is appended
 * to the grid container.
 *
 * @param {Array<Object>} meals - Array of meal objects from the API.
 */
function renderRecipeGrid(meals) {
    // Hide loading and error states.
    loadingEl.hidden = true;
    errorState.hidden = true;

    // --- Step 1: Clear the grid ---
    // Remove all existing cards so we don't duplicate results.
    recipeGrid.innerHTML = '';

    // --- Step 2 & 3: Loop and create cards ---
    // forEach() iterates through every meal in the array.
    // For each meal, we create a card and append it to the grid.
    meals.forEach(function (meal) {
        const card = createRecipeCard(meal);
        recipeGrid.appendChild(card);
    });
}

/**
 * CREATE RECIPE CARD — Builds a single card element for one meal.
 *
 * Structure produced:
 *   <div class="recipe-card" data-meal-id="52772">
 *       <div class="card-image-wrapper">
 *           <img class="card-image" src="..." alt="...">
 *           <span class="card-badge">Chicken</span>
 *       </div>
 *       <div class="card-info">
 *           <h3 class="card-title">Teriyaki Chicken</h3>
 *           <p class="card-meta">Japanese</p>
 *       </div>
 *   </div>
 *
 * WHY data-meal-id?
 *   We store the meal's unique ID as a data attribute so that
 *   when the card is clicked, we can read it back and use it
 *   to fetch the full meal details from the API.
 *
 * @param {Object} meal - A single meal object from the API.
 * @returns {HTMLDivElement} The fully built card element.
 */
function createRecipeCard(meal) {
    // --- Create the outer card container ---
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.setAttribute('data-meal-id', meal.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View recipe: ${meal.name}`);

    // --- Image wrapper ---
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'card-image-wrapper';

    const img = document.createElement('img');
    img.className = 'card-image';
    img.src = meal.thumbnail;
    img.alt = meal.name;
    img.loading = 'lazy'; // Lazy load for performance

    imageWrapper.appendChild(img);

    // Category badge (only if category data is available)
    if (meal.category) {
        const badge = document.createElement('span');
        badge.className = 'card-badge';
        badge.textContent = meal.category;
        imageWrapper.appendChild(badge);
    }

    // --- Info section ---
    const info = document.createElement('div');
    info.className = 'card-info';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = meal.name;

    info.appendChild(title);

    // Area/cuisine (if available from full search data)
    if (meal.area) {
        const meta = document.createElement('p');
        meta.className = 'card-meta';
        meta.textContent = meal.area + ' Cuisine';
        info.appendChild(meta);
    }

    // --- Assemble the card ---
    card.appendChild(imageWrapper);
    card.appendChild(info);

    return card;
}


// ============================================================
// SECTION 5: MODAL LOGIC (EDUCATIONAL)
// ============================================================
//
// The modal is controlled by TWO mechanisms working together:
//
//   1. HTML `hidden` attribute — removes the modal from the
//      document flow and accessibility tree when not in use.
//
//   2. CSS class `.open` — controls the visual transition
//      (opacity, visibility, transform) for smooth animations.
//
// OPEN flow:   remove hidden → add .open class (triggers CSS transition)
// CLOSE flow:  remove .open class (triggers CSS transition) → wait → add hidden
//
// The `transitionend` event is used in closeModal() to wait
// for the CSS exit animation to finish before adding `hidden`.
// This prevents the modal from "jumping" to hidden mid-animation.
//
// ============================================================

/**
 * OPEN MODAL — Populates and displays the recipe detail overlay.
 *
 * This function does three things:
 *   1. Fills the modal's DOM elements with the meal's data.
 *   2. Removes the `hidden` attribute so the modal enters the DOM.
 *   3. Adds the `open` class after a tiny delay (requestAnimationFrame)
 *      to trigger the CSS transition. Without this delay, the browser
 *      batches the hidden removal and class addition into one paint,
 *      skipping the animation.
 *
 * @param {Object} meal - The full meal object from the Lookup API.
 */
function openModal(meal) {
    // --- 1. Populate the modal with data ---

    // Set the header image.
    modalImage.src = meal.thumbnail;
    modalImage.alt = meal.name;

    // Set the title.
    modalTitle.textContent = meal.name;

    // Set category and area tags.
    modalCategory.textContent = meal.category || '';
    modalArea.textContent = meal.area || '';

    // Set the cooking instructions.
    modalInstructions.textContent = meal.instructions || 'No instructions available.';

    // Render the ingredients list directly from the normalized array.
    renderIngredients(meal.ingredients);

    // Set the YouTube link (if available).
    if (meal.youtube) {
        modalYoutube.href = meal.youtube;
        modalYoutube.removeAttribute('hidden');
    } else {
        modalYoutube.setAttribute('hidden', '');
    }

    // --- 2. Remove hidden to put the modal in the DOM ---
    modalOverlay.removeAttribute('hidden');

    // --- 3. Add the 'open' class after one animation frame ---
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            modalOverlay.classList.add('open');
        });
    });

    // Prevent background scrolling while modal is open.
    document.body.classList.add('modal-open');
}

/**
 * CLOSE MODAL — Hides the recipe detail overlay with animation.
 *
 * Steps:
 *   1. Remove the 'open' class → triggers CSS exit transition.
 *   2. Wait for the transition to complete (transitionend event).
 *   3. Add the 'hidden' attribute to fully remove from the DOM.
 *   4. Re-enable background scrolling.
 */
function closeModal() {
    // Step 1: Start the exit animation by removing 'open'.
    modalOverlay.classList.remove('open');

    // Step 2: Wait for the CSS transition to finish.
    // We listen for the 'transitionend' event on the overlay.
    // { once: true } ensures the listener auto-removes after firing.
    modalOverlay.addEventListener('transitionend', function () {
        // Step 3: Now that the animation is done, truly hide it.
        modalOverlay.setAttribute('hidden', '');
    }, { once: true });

    // Step 4: Re-enable background scrolling.
    document.body.classList.remove('modal-open');
}


// ============================================================
// SECTION 6: INGREDIENT EXTRACTION (EDUCATIONAL)
// ============================================================
//
// TheMealDB stores ingredients in a FLAT, numbered format:
//   strIngredient1, strIngredient2, ... strIngredient20
//   strMeasure1,    strMeasure2,    ... strMeasure20
//
// This is NOT an array — it's 40 separate properties.
// Our job is to loop from 1 to 20, check if each ingredient
// is non-empty, and collect the valid ones into an array.
//
// We use BRACKET NOTATION (meal['strIngredient' + i]) to
// dynamically construct property names. This is the same as:
//   meal.strIngredient1 when i = 1
//   meal.strIngredient2 when i = 2
//   etc.
//
// Bracket notation lets us use a variable as part of the
// property name, which dot notation cannot do.
// ============================================================

// (extractIngredients has been moved into normalizeMealDBRecipe)
/**
 * RENDER INGREDIENTS — Maps the ingredients array to <li> elements.
 *
 * @param {Array<{ingredient: string, measure: string}>} ingredients
 */
function renderIngredients(ingredients) {
    // Clear previous ingredients.
    modalIngredients.innerHTML = '';

    ingredients.forEach(function (item) {
        const li = document.createElement('li');
        li.className = 'ingredient-item';

        // Show measure in muted color next to the ingredient name.
        if (item.measure) {
            li.innerHTML = `${item.ingredient} <span class="ingredient-measure">— ${item.measure}</span>`;
        } else {
            li.textContent = item.ingredient;
        }

        modalIngredients.appendChild(li);
    });
}


// ============================================================
// UI State Helpers
// ============================================================

function showLoading() {
    recipeGrid.innerHTML = '';
    errorState.hidden = true;
    loadingEl.hidden = false;
}

function showError(message) {
    recipeGrid.innerHTML = '';
    loadingEl.hidden = true;
    errorState.hidden = false;
    errorText.textContent = message;
}


// ============================================================
// EVENT LISTENERS — Wiring Up the Application
// ============================================================

/**
 * SEARCH FORM SUBMIT — Fetch recipes matching the search query.
 */
searchForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const query = searchInput.value.trim();
    if (!query) return;

    // Reset filter to "All" when searching by name.
    setActiveFilter('all');
    currentCategory = 'all';

    searchRecipes(query);
});

/**
 * RECIPE GRID CLICK — Event delegation for card clicks.
 *
 * Instead of attaching a click listener to every card, we attach
 * ONE listener to the parent grid. When a child card is clicked,
 * the event bubbles up to the grid. We use .closest() to find
 * which card was clicked and read its data-meal-id attribute.
 */
recipeGrid.addEventListener('click', function (event) {
    const card = event.target.closest('.recipe-card');
    if (!card) return;

    const mealId = card.dataset.mealId;
    if (mealId) {
        fetchMealDetails(mealId);
    }
});

// Also support keyboard activation (Enter/Space) for accessibility.
recipeGrid.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
        const card = event.target.closest('.recipe-card');
        if (!card) return;

        event.preventDefault();
        const mealId = card.dataset.mealId;
        if (mealId) {
            fetchMealDetails(mealId);
        }
    }
});

/**
 * CATEGORY FILTER BUTTONS — Switch between recipe categories.
 *
 * Each filter button has a data-category attribute ('all', 'Beef',
 * 'Chicken', etc.). When clicked, we either load the initial
 * diverse set (for 'all') or fetch from the category endpoint.
 */
filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
        const category = btn.dataset.category;

        // Don't refetch if already on this category.
        if (category === currentCategory) return;

        currentCategory = category;
        setActiveFilter(category);

        // Clear the search input when switching categories.
        searchInput.value = '';

        if (category === 'all') {
            loadInitialRecipes();
        } else {
            fetchByCategory(category);
        }
    });
});

/**
 * Updates the visual active state on filter buttons.
 *
 * @param {string} activeCategory - The category to highlight.
 */
function setActiveFilter(activeCategory) {
    filterButtons.forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.category === activeCategory);
    });
}

/**
 * MODAL CLOSE BUTTON — Close the modal when the × is clicked.
 */
modalCloseBtn.addEventListener('click', closeModal);

/**
 * MODAL BACKDROP CLICK — Close when clicking outside the content.
 * We check if the click target is the overlay itself (not a child).
 */
modalOverlay.addEventListener('click', function (event) {
    if (event.target === modalOverlay) {
        closeModal();
    }
});

/**
 * ESCAPE KEY — Close the modal when pressing Escape.
 */
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modalOverlay.classList.contains('open')) {
        closeModal();
    }
});


// ============================================================
// Initialization — Load recipes on page start
// ============================================================

loadInitialRecipes();
