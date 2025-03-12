/**
 * Input Handler - Manages keyboard, touch, and device orientation input
 */
import { handlePlayerMovement } from '../entities/player.js';
import { toggleMusic } from '../core/audio.js';
import { saveMusicPreferences } from '../state/gameState.js';

// Variables for device orientation handling
let lastOrientationTime = 0;
const ORIENTATION_THROTTLE = 200; // ms between orientation updates to prevent over-sensitivity
let isDeviceOrientationSupported = false;

// Simple check for mobile device
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
};

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
    
    // Check if device orientation is supported
    if (window.DeviceOrientationEvent) {
        console.log("Device orientation is supported");
        
        // Request permission for device orientation on iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires user interaction to request permission
            const requestOrientationAccess = () => {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', (event) => {
                                handleDeviceOrientation(event, gameState, player);
                            });
                            isDeviceOrientationSupported = true;
                            showTiltInstructions();
                        } else {
                            console.log("Device orientation permission denied");
                        }
                    })
                    .catch(console.error);
                
                // Remove this listener after first touch
                document.removeEventListener('touchstart', requestOrientationAccess);
                document.removeEventListener('click', requestOrientationAccess);
            };
            
            // Add event listeners to request permission on first interaction
            document.addEventListener('touchstart', requestOrientationAccess, { once: true });
            document.addEventListener('click', requestOrientationAccess, { once: true });
            
        } else {
            // For non-iOS devices, simply add the event listener
            window.addEventListener('deviceorientation', (event) => {
                handleDeviceOrientation(event, gameState, player);
            });
            isDeviceOrientationSupported = true;
            showTiltInstructions();
        }
    } else {
        console.log("Device orientation is not supported");
        // Still check if it's a mobile device to show tilt instructions
        if (isMobileDevice()) {
            showTiltInstructions();
        }
    }
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

/**
 * Show tilt instructions in the UI if device orientation is supported
 */
function showTiltInstructions() {
    const tiltInstructions = document.getElementById('tilt-instructions');
    if (tiltInstructions) {
        // Show tilt instructions for mobile devices
        if (isMobileDevice()) {
            tiltInstructions.style.display = 'inline';
        }
    }
}

/**
 * Handle device orientation input for mobile devices
 * @param {DeviceOrientationEvent} event - The device orientation event
 * @param {Object} gameState - The game state
 * @param {Object} player - The player object
 */
function handleDeviceOrientation(event, gameState, player) {
    // Only handle movement if game is active
    if (!gameState.gameStarted) return;
    
    // Throttle orientation events to prevent excessive input
    const now = Date.now();
    if (now - lastOrientationTime < ORIENTATION_THROTTLE) return;
    lastOrientationTime = now;
    
    // Get gamma value (left/right tilt)
    const gamma = event.gamma;
    
    // Don't respond to very small tilts to prevent unintended movement
    if (Math.abs(gamma) < 5) return;
    
    // Determine direction based on tilt
    let key;
    if (gamma < -5) {
        // Tilting left (gamma negative) - move left
        key = 'ArrowLeft';
    } else if (gamma > 5) {
        // Tilting right (gamma positive) - move right
        key = 'ArrowRight';
    } else {
        return; // No significant tilt
    }
    
    // Create a synthetic keyboard event to reuse existing logic
    const syntheticEvent = { key, preventDefault: () => {} };
    gameState.currentLane = handlePlayerMovement(syntheticEvent, player, gameState.currentLane);
}

export default {
    initInputHandling
};