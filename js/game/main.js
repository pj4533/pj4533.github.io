/**
 * NEON WAVE Game - Main Entry Point
 * Imports and initializes all game components
 */
import { sceneManager } from './core/setup.js';
import { initGame, refreshGame } from './engine/gameInitializer.js';
import { toggleMusic, setMusicVolume } from './core/audio.js';
import gameState from './state/gameState.js';

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initGame);

// Export for use in other modules
export {
    gameState,
    sceneManager,
    refreshGame,
    toggleMusic,
    setMusicVolume
};