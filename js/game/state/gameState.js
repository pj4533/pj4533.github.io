/**
 * GameState module - Manages the game's state variables
 */
import { DEFAULT_LANE, DEFAULT_MUSIC_ENABLED } from '../core/constants.js';

// Core game state
const state = {
    // Game status
    gameStarted: true, // Start game immediately
    gameOver: false,
    
    // Progress tracking
    score: 0,
    highScore: 0,
    level: 1,
    
    // Player state
    currentLane: DEFAULT_LANE,
    
    // Game settings
    musicEnabled: DEFAULT_MUSIC_ENABLED,
    
    // Timers
    lastCollectibleTime: 0,
    
    // Animation ID
    animationId: null
};

/**
 * Updates the player's score
 * @param {number} newScore - The new score
 */
export function updateScore(newScore) {
    state.score = newScore;
}

/**
 * Saves the high score to localStorage
 */
export function saveHighScore() {
    try {
        localStorage.setItem('neonWaveHighScore', state.highScore.toString());
    } catch (err) {
        console.error('Error saving high score:', err);
    }
}

/**
 * Loads the high score from localStorage
 */
export function loadHighScore() {
    try {
        if (localStorage.getItem('neonWaveHighScore')) {
            state.highScore = parseInt(localStorage.getItem('neonWaveHighScore'));
            console.log('Loaded high score:', state.highScore);
        }
    } catch (err) {
        console.error('Error loading high score:', err);
    }
}

/**
 * Loads music preferences from localStorage
 */
export function loadMusicPreferences() {
    try {
        if (localStorage.getItem('neonWaveMusicEnabled') !== null) {
            state.musicEnabled = localStorage.getItem('neonWaveMusicEnabled') === 'true';
            return state.musicEnabled;
        }
    } catch (err) {
        console.error('Error loading music preferences:', err);
    }
    return state.musicEnabled;
}

/**
 * Saves music preferences to localStorage
 */
export function saveMusicPreferences() {
    try {
        localStorage.setItem('neonWaveMusicEnabled', state.musicEnabled.toString());
    } catch (err) {
        console.error('Error saving music preference:', err);
    }
}

/**
 * Sets the game as started
 */
export function startGame() {
    state.gameStarted = true;
    state.gameOver = false;
    state.score = 0;
    state.lastCollectibleTime = Date.now();
}

/**
 * Resets the game to initial state
 */
export function resetGame() {
    state.level = 1;
    state.score = 0;
    state.lastCollectibleTime = Date.now();
}

export default state;