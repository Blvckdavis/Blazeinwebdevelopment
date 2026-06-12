/* ============================================================================
   SIWES PORTAL - FORM & LOCALSTORAGE MANAGEMENT
   ============================================================================ */

/**
 * Get all saved evaluations from localStorage
 * @returns {Array} Array of evaluation objects
 */
function getSiwesEvaluations() {
  const data = localStorage.getItem('siwesEvaluations');
  return data ? JSON.parse(data) : [];
}

/**
 * Save a new evaluation to localStorage
 * @param {Object} evaluation - Object with organizationName and evaluationNotes
 */
function saveSiwesEvaluation(evaluation) {
  const evaluations = getSiwesEvaluations();
  evaluations.push(evaluation);
  localStorage.setItem('siwesEvaluations', JSON.stringify(evaluations));
}

/**
 * Create and display a glass card for an evaluation
 * @param {Object} evaluation - Object with organizationName and evaluationNotes
 * @returns {HTMLElement} The created card element
 */
function createEvaluationCard(evaluation) {
  const card = document.createElement('div');
  card.className = 'glass-card';
  card.style.marginTop = '1rem';
  
  const title = document.createElement('h4');
  title.textContent = evaluation.organizationName;
  title.style.color = 'var(--text-primary)';
  title.style.marginBottom = '0.5rem';
  
  const notes = document.createElement('p');
  notes.textContent = evaluation.evaluationNotes;
  notes.style.color = 'var(--text-muted)';
  
  card.appendChild(title);
  card.appendChild(notes);
  
  return card;
}

/**
 * Display all saved evaluations below the form
 */
function displayAllEvaluations() {
  const siwesSection = document.getElementById('siwes');
  const form = siwesSection.querySelector('form');
  
  // Remove existing evaluation cards (keep only original form)
  const existingCards = siwesSection.querySelectorAll('.glass-card');
  existingCards.forEach(card => card.remove());
  
  // Get and display all evaluations from localStorage
  const evaluations = getSiwesEvaluations();
  evaluations.forEach(evaluation => {
    const card = createEvaluationCard(evaluation);
    siwesSection.appendChild(card);
  });
}

/**
 * Handle form submission
 */
function handleFormSubmit(event) {
  event.preventDefault();
  
  // Get form references
  const form = event.target;
  const organizationInput = form.querySelector('#company');
  const notesTextarea = form.querySelector('#comments');
  
  // Extract values
  const organizationName = organizationInput.value.trim();
  const evaluationNotes = notesTextarea.value.trim();
  
  // Validate inputs
  if (!organizationName || !evaluationNotes) {
    alert('Please fill in both fields before submitting.');
    return;
  }
  
  // Create evaluation object
  const evaluation = {
    organizationName: organizationName,
    evaluationNotes: evaluationNotes,
    timestamp: new Date().toISOString()
  };
  
  // Save to localStorage
  saveSiwesEvaluation(evaluation);
  
  // Display updated evaluations
  displayAllEvaluations();
  
  // Reset form for next entry
  form.reset();
  
  // Optional: Show confirmation message
  console.log('Evaluation saved successfully!', evaluation);
}

/**
 * Initialize the script when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get the form inside the #siwes section
  const siwesSection = document.getElementById('siwes');
  const form = siwesSection.querySelector('form');
  
  // Attach submit event listener
  form.addEventListener('submit', handleFormSubmit);
  
  // Attach event listener for clear evaluations button
  const clearButton = document.getElementById('clear-evaluations');
  clearButton.addEventListener('click', function() {
    // Remove from localStorage
    localStorage.removeItem('siwesEvaluations');
    
    // Remove all glass-card elements from DOM
    document.querySelectorAll('.glass-card').forEach(card => card.remove());
    
    // Optional: Show confirmation
    console.log('All evaluations cleared!');
  });
  
  // Load and display existing evaluations on page load
  displayAllEvaluations();
});
