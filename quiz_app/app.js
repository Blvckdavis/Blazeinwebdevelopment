/**
 * INTERACTIVE QUIZ APP - INTERMEDIATE FRONTEND PROJECT
 * 
 * ==============================================================================
 * HOW IT WORKS (SIWES Documentation & Architecture)
 * ==============================================================================
 * 
 * 1. CONCURRENT ASYNCHRONOUS DATA FETCHING (Promise.all):
 *    The app fetches questions from two distinct Open Trivia DB categories simultaneously:
 *    - Category 18: Science: Computers (5 questions)
 *    - Category 9: General Knowledge (5 questions)
 *    `Promise.all` is used to execute both HTTP requests in parallel for optimal performance.
 * 
 * 2. DATA MERGING & CATEGORY RANDOMIZATION:
 *    The `results` arrays from both API responses are merged into a single array of 10 questions,
 *    which is then shuffled using the Fisher-Yates algorithm so the categories are evenly mixed.
 * 
 * 3. OPTION MERGING & SHUFFLING:
 *    For each individual question, `correct_answer` and `incorrect_answers` are merged into 
 *    a single array and shuffled so the correct answer appears in a random position.
 * 
 * 4. HTML ENTITY DECODING:
 *    All fetched strings containing HTML entities (e.g. &quot;, &#039;, &amp;, &eacute;) are 
 *    properly decoded using `DOMParser` before rendering to the DOM.
 * 
 * 5. STATE MANAGEMENT & DOM INTERACTION:
 *    - `quizState` manages current question index and score.
 *    - Visual feedback (green/red) and automated progression guide the user experience.
 * ==============================================================================
 */

// --- 1. CONFIGURATION & CONSTANTS ---
const COMPUTER_SCIENCE_API_URL = 'https://opentdb.com/api.php?amount=5&category=18&type=multiple';
const GENERAL_KNOWLEDGE_API_URL = 'https://opentdb.com/api.php?amount=5&category=9&type=multiple';

// Dynamic quiz data populated from Open Trivia DB
let quizData = [];

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

// --- 4. HELPER FUNCTIONS ---

/**
 * Decodes HTML entities (e.g. &quot;, &#039;, &amp;) in a string.
 * Uses DOMParser to safely parse HTML entities into plain text.
 * 
 * @param {string} str - The string containing HTML entities.
 * @returns {string} The decoded plain text string.
 */
function decodeHTMLEntities(str) {
    if (!str) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.documentElement.textContent || '';
}

/**
 * Shuffles an array in-place using the Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new shuffled array without mutating the original.
 * 
 * @param {Array} array - The array of items to shuffle.
 * @returns {Array} A newly shuffled copy of the array.
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// --- 5. ASYNCHRONOUS DATA FETCHING ---

/**
 * Asynchronously fetches 5 Computer Science and 5 General Knowledge questions
 * simultaneously using Promise.all, merges and shuffles the questions and their options,
 * and decodes all HTML entities.
 * 
 * @returns {Promise<Array>} The processed array of 10 mixed question objects.
 */
async function fetchQuestions() {
    try {
        // Fetch both endpoints concurrently using Promise.all
        const [csResponse, gkResponse] = await Promise.all([
            fetch(COMPUTER_SCIENCE_API_URL),
            fetch(GENERAL_KNOWLEDGE_API_URL)
        ]);

        if (!csResponse.ok || !gkResponse.ok) {
            throw new Error('Failed to fetch from one or more Open Trivia DB endpoints.');
        }

        // Parse JSON responses in parallel
        const [csData, gkData] = await Promise.all([
            csResponse.json(),
            gkResponse.json()
        ]);

        const csResults = csData.results || [];
        const gkResults = gkData.results || [];

        // Merge results into a single array of 10 questions
        const combinedQuestions = [...csResults, ...gkResults];

        if (combinedQuestions.length === 0) {
            throw new Error('No quiz questions were returned by the API endpoints.');
        }

        // Shuffle the combined questions array so categories are mixed
        const mixedQuestions = shuffleArray(combinedQuestions);

        // Transform and normalize each question
        quizData = mixedQuestions.map((item) => {
            // Decode HTML entities for question and answers
            const decodedQuestion = decodeHTMLEntities(item.question);
            const decodedCorrectAnswer = decodeHTMLEntities(item.correct_answer);
            const decodedIncorrectAnswers = item.incorrect_answers.map(decodeHTMLEntities);

            // Merge correct_answer and incorrect_answers into a single array
            const mergedAnswers = [decodedCorrectAnswer, ...decodedIncorrectAnswers];

            // Shuffle the merged answers array so the correct answer is in a random position
            const shuffledOptions = shuffleArray(mergedAnswers);

            // Find index of the correct answer in the shuffled options
            const correctAnswerIndex = shuffledOptions.indexOf(decodedCorrectAnswer);

            return {
                question: decodedQuestion,
                options: shuffledOptions,
                correctAnswerIndex: correctAnswerIndex,
                category: decodeHTMLEntities(item.category)
            };
        });

        return quizData;
    } catch (error) {
        console.error('Error fetching mixed quiz data:', error);
        throw error;
    }
}

// --- 6. CORE LOGIC ---

/**
 * Initializes the quiz by resetting the state, fetching mixed questions dynamically,
 * and rendering the first question.
 */
async function initQuiz() {
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizData = [];
    
    // Reset UI visibility
    elements.quizHeader.hidden = false;
    elements.quizBody.hidden = false;
    elements.resultScreen.hidden = true;

    // Display loading state
    elements.questionText.textContent = "Loading questions...";
    elements.optionsContainer.innerHTML = '';
    elements.progressText.textContent = "Fetching mixed quiz from Open Trivia DB...";
    elements.progressBarFill.style.width = '0%';
    
    try {
        await fetchQuestions();
        renderQuestion();
    } catch (error) {
        elements.questionText.textContent = "Failed to load questions. Please check your internet connection and try again.";
        elements.optionsContainer.innerHTML = '';
        
        const retryBtn = document.createElement('button');
        retryBtn.textContent = "Retry";
        retryBtn.classList.add('option-btn');
        retryBtn.style.textAlign = 'center';
        retryBtn.addEventListener('click', initQuiz);
        elements.optionsContainer.appendChild(retryBtn);
    }
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
        if (correctButton) {
            correctButton.classList.add('correct');
        }
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
    } else if (percentage >= 0.7) {
        elements.resultMessage.textContent = "Great Job! 🌟";
    } else if (percentage >= 0.4) {
        elements.resultMessage.textContent = "Good Effort! 👍";
    } else {
        elements.resultMessage.textContent = "Keep Practicing! 💪";
    }
}

// --- 7. EVENT LISTENERS ---
elements.restartBtn.addEventListener('click', initQuiz);

// --- 8. BOOTSTRAP ---
// Start the quiz when the script loads
initQuiz();
