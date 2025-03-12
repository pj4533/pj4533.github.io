/**
 * Input Handler - Manages keyboard and touch input
 */
import { handlePlayerMovement } from '../entities/player.js';
import { toggleMusic } from '../core/audio.js';
import { saveMusicPreferences } from '../state/gameState.js';

/**
 * Initialize input handling
 * @param {Object} gameState - The game state
 * @param {Object} player - The player object
 * @param {Function} refreshGame - Function to refresh the game
 * @param {Function} updateMusicToggleButton - Function to update music toggle UI
 * @param {Function} unlockAudio - Function to unlock audio
 */
export function initInputHandling(gameState, player, refreshGame, updateMusicToggleButton, unlockAudio) {
    // Handle keyboard input
    document.addEventListener('keydown', (event) => {
        handleKeyDown(event, gameState, player, refreshGame, updateMusicToggleButton, unlockAudio);
    });
}

/**
 * Handle keyboard input
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} gameState - The game state
 * @param {Object} player - The player object
 * @param {Function} refreshGame - Function to refresh the game
 * @param {Function} updateMusicToggleButton - Function to update music toggle UI
 * @param {Function} unlockAudio - Function to unlock audio
 */
function handleKeyDown(event, gameState, player, refreshGame, updateMusicToggleButton, unlockAudio) {
    // Prevent default action for arrow keys and space
    if (event.key === ' ' || 
        event.key === 'ArrowLeft' || 
        event.key === 'ArrowRight' || 
        event.key === 'ArrowUp' || 
        event.key === 'ArrowDown' ||
        event.key === 'm' ||
        event.key === 'M') {
        event.preventDefault();
    }
    
    // Spacebar no longer needed to start game
    if (event.key === ' ') {
        // Game starts automatically, so nothing to do here
    }
    
    // Add R key to refresh the game and repos
    if (event.key === 'r' || event.key === 'R') {
        if (gameState.gameStarted) {
            refreshGame();
            return;
        }
    }
    
    // Toggle music with M key
    if (event.key === 'm' || event.key === 'M') {
        // Unlock audio first (needed for iOS and some browsers)
        unlockAudio();
        
        gameState.musicEnabled = toggleMusic();
        updateMusicToggleButton();
        
        // Save preference
        saveMusicPreferences();
        return;
    }
    
    // Only handle movement if game is active
    if (!gameState.gameStarted) return;
    
    // Handle player movement using the player module
    gameState.currentLane = handlePlayerMovement(event, player, gameState.currentLane);
}

export default {
    initInputHandling
};