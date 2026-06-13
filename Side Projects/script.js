/* ==========================================================================
   SIWES Portal — Form & localStorage Management
   ========================================================================== */

/**
 * Show a toast notification instead of alert().
 * @param {string} message - Text to display
 * @param {'success'|'error'} type - Toast variant
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast visible' + (type === 'error' ? ' error' : '');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () {
    toast.classList.remove('visible');
  }, 2500);
}

/**
 * Read evaluations from localStorage.
 * @returns {Array} Array of evaluation objects
 */
function getEvaluations() {
  try {
    return JSON.parse(localStorage.getItem('siwesEvaluations')) || [];
  } catch (_) {
    return [];
  }
}

/**
 * Save a single evaluation to localStorage.
 * @param {Object} evaluation - { organizationName, evaluationNotes, timestamp }
 */
function saveEvaluation(evaluation) {
  var evaluations = getEvaluations();
  evaluations.push(evaluation);
  localStorage.setItem('siwesEvaluations', JSON.stringify(evaluations));
}

/**
 * Create a card DOM element for one evaluation.
 * @param {Object} evaluation
 * @returns {HTMLElement}
 */
function createCard(evaluation) {
  var card = document.createElement('div');
  card.className = 'eval-card';

  var title = document.createElement('h4');
  title.textContent = evaluation.organizationName;

  var notes = document.createElement('p');
  notes.textContent = evaluation.evaluationNotes;

  card.appendChild(title);
  card.appendChild(notes);
  return card;
}

/**
 * Re-render all saved evaluations below the form.
 */
function renderEvaluations() {
  var section = document.getElementById('siwes');

  // Remove any previously rendered cards
  var existing = section.querySelectorAll('.eval-card');
  existing.forEach(function (el) { el.remove(); });

  // Append one card per saved evaluation
  getEvaluations().forEach(function (evaluation) {
    section.appendChild(createCard(evaluation));
  });
}

/**
 * Handle form submission.
 */
function handleSubmit(event) {
  event.preventDefault();

  var form = event.target;
  var orgName = form.querySelector('#company').value.trim();
  var notes = form.querySelector('#comments').value.trim();

  if (!orgName || !notes) {
    showToast('Please fill in both fields before submitting.', 'error');
    return;
  }

  saveEvaluation({
    organizationName: orgName,
    evaluationNotes: notes,
    timestamp: new Date().toISOString()
  });

  renderEvaluations();
  form.reset();
  showToast('Evaluation saved successfully!');
}

/* --- Init --- */

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('siwes-form');
  form.addEventListener('submit', handleSubmit);

  document.getElementById('clear-evaluations').addEventListener('click', function () {
    localStorage.removeItem('siwesEvaluations');
    document.querySelectorAll('.eval-card').forEach(function (el) { el.remove(); });
    showToast('All evaluations cleared.');
  });

  renderEvaluations();
});
