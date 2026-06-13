/**
 * INTERACTIVE QUIZ APP - INTERMEDIATE FRONTEND PROJECT
 * 
 * ==============================================================================
 * HOW IT WORKS (SIWES Documentation)
 * ==============================================================================
 * 
 * 1. STATE MANAGEMENT: 
 *    The app uses a unified 'state' object (`quizState`) to track the current 
 *    question index and the user's score. This ensures data is decoupled from the DOM.
 * 
 * 2. DATA STRUCTURE: 
 *    The questions are stored in an array of objects (`quizData`). Each object 
 *    contains the question text, an array of options, and the index of the correct answer.
 * 
 * 3. DOM MANIPULATION (Rendering): 
 *    The `renderQuestion` function dynamically generates the HTML buttons for 
 *    the options. It clears the previous options and creates new ones using 
 *    `document.createElement`, preventing XSS vulnerabilities compared to using innerHTML.
 * 
 * 4. EVENT DELEGATION & HANDLING: 
 *    When an option is clicked, `handleAnswerSelection` evaluates the choice. 
 *    It temporarily disables all buttons to prevent multiple clicks, applies 
 *    CSS classes for visual feedback (green for correct, red for wrong), and 
 *    uses a `setTimeout` to automatically advance to the next question.
 * 
 * 5. SEPARATION OF CONCERNS:
 *    - HTML (Structure): Semantic tags (<main>, <section>, <header>).
 *    - CSS (Presentation): CSS Variables for theming, Flexbox for layout, Glassmorphism.
 *    - JS (Behavior): Modular functions handling single responsibilities.
 * ==============================================================================
 */

// --- 1. QUIZ DATA ---
const quizData = [
    {
        question: "Which planet is known as the Red Planet?",
        options: [
            "Venus",
            "Jupiter",
            "Mars",
            "Saturn"
        ],
        correctAnswerIndex: 2
    },
    {
        question: "What is the largest ocean on Earth?",
        options: [
            "Atlantic Ocean",
            "Indian Ocean",
            "Arctic Ocean",
            "Pacific Ocean"
        ],
        correctAnswerIndex: 3
    },
    {
        question: "Who painted the Mona Lisa?",
        options: [
            "Vincent van Gogh",
            "Leonardo da Vinci",
            "Pablo Picasso",
            "Claude Monet"
        ],
        correctAnswerIndex: 1
    },
    {
        question: "Which continent is the Sahara Desert located in?",
        options: [
            "Asia",
            "South America",
            "Africa",
            "Australia"
        ],
        correctAnswerIndex: 2
    },
    {
        question: "What is the chemical symbol for Gold?",
        options: [
            "Ag",
            "Au",
            "Fe",
            "Pb"
        ],
        correctAnswerIndex: 1
    }
];

// --- 2. STATE MANAGEMENT ---
const quizState = {
    currentQuestionIndex: 0,
    score: 0
};

// --- 3. DOM ELEMENTS ---
const elements = {
    quizHeader: document.getElementById('quiz-header'),
    quizBody: document.getElementById('quiz-body'),
    resultScreen: document.getElementById('result-screen'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    progressText: document.getElementById('progress-text'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    finalScoreText: document.getElementById('final-score'),
    resultMessage: document.getElementById('result-message'),
    restartBtn: document.getElementById('restart-btn')
};

// --- 4. CORE LOGIC ---

/**
 * Initializes the quiz by resetting the state and rendering the first question.
 */
function initQuiz() {
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    
    // Reset UI visibility
    elements.quizHeader.hidden = false;
    elements.quizBody.hidden = false;
    elements.resultScreen.hidden = true;
    
    renderQuestion();
}

/**
 * Renders the current question, its options, and updates the progress bar.
 */
function renderQuestion() {
    const currentQuestion = quizData[quizState.currentQuestionIndex];
    const totalQuestions = quizData.length;
    
    // Update Progress UI
    elements.progressText.textContent = `Question ${quizState.currentQuestionIndex + 1} of ${totalQuestions}`;
    const progressPercentage = ((quizState.currentQuestionIndex) / totalQuestions) * 100;
    elements.progressBarFill.style.width = `${progressPercentage}%`;

    // Inject Question Text
    elements.questionText.textContent = currentQuestion.question;

    // Clear previous options
    elements.optionsContainer.innerHTML = '';

    // Generate new option buttons
    currentQuestion.options.forEach((optionText, index) => {
        const button = document.createElement('button');
        button.textContent = optionText;
        button.classList.add('option-btn');
        
        // Add event listener for selection
        button.addEventListener('click', () => handleAnswerSelection(index, button));
        
        elements.optionsContainer.appendChild(button);
    });
}

/**
 * Handles the logic when a user clicks an option.
 * Evaluates the answer, provides visual feedback, and advances the quiz.
 * 
 * @param {number} selectedIndex - The index of the option the user clicked.
 * @param {HTMLElement} selectedButton - The button element that was clicked.
 */
function handleAnswerSelection(selectedIndex, selectedButton) {
    const currentQuestion = quizData[quizState.currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

    // Disable all buttons immediately to prevent double-clicking
    const allButtons = elements.optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    // Evaluate answer and apply visual feedback
    if (isCorrect) {
        selectedButton.classList.add('correct');
        quizState.score++;
    } else {
        selectedButton.classList.add('wrong');
        
        // Highlight the correct answer for the user
        const correctButton = allButtons[currentQuestion.correctAnswerIndex];
        correctButton.classList.add('correct');
    }

    // Advance to the next question or show results after a short delay (for UX)
    setTimeout(() => {
        quizState.currentQuestionIndex++;
        
        if (quizState.currentQuestionIndex < quizData.length) {
            renderQuestion();
        } else {
            showResults();
        }
    }, 1200); // 1.2 second delay lets the user see the result of their click
}

/**
 * Hides the quiz body and displays the final score screen.
 */
function showResults() {
    elements.quizHeader.hidden = true;
    elements.quizBody.hidden = true;
    elements.resultScreen.hidden = false;
    
    // Fill progress bar to 100% on completion
    elements.progressBarFill.style.width = `100%`;
    
    const totalQuestions = quizData.length;
    elements.finalScoreText.textContent = `${quizState.score}/${totalQuestions}`;
    
    // Provide dynamic feedback based on performance
    const percentage = quizState.score / totalQuestions;
    if (percentage === 1) {
        elements.resultMessage.textContent = "Perfect Score! 🏆";
    } else if (percentage >= 0.6) {
        elements.resultMessage.textContent = "Great Job! 🌟";
    } else {
        elements.resultMessage.textContent = "Keep Practicing! 💪";
    }
}

// --- 5. EVENT LISTENERS ---
elements.restartBtn.addEventListener('click', initQuiz);

// --- 6. BOOTSTRAP ---
// Start the quiz when the script loads
initQuiz();
