/**
 * Game UI Interface Module
 * Handles UI elements and interactions
 */

/**
 * Updates the score display
 * @param {number} score - Current game score
 * @param {number} highScore - Current high score
 */
export function updateScoreDisplay(score, highScore) {
    // Add implementation when needed
}

/**
 * Shows the game over screen
 * @param {number} finalScore - Final score to display
 * @param {number} highScore - High score to display
 */
export function showGameOverScreen(finalScore, highScore) {
    // Add implementation when needed
}

/**
 * Hides the start screen
 */
export function hideStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('hidden');
    }
}