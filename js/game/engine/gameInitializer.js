/**
 * Game Initializer - Handles game setup and initialization
 */
import { sceneManager } from '../core/setup.js';
import { initializePlayer } from '../entities/player.js';
import { initAudio, startMusic, unlockAudio } from '../core/audio.js';
import { fetchGitHubRepos } from '../data/github.js';
import { fetchGitHubProfileData, processGitHubProfileData } from '../data/profile.js';
import { createCollectible } from '../entities/collectibles/collectibleFactory.js';
import { addCollectible, clearCollectibles } from '../entities/collectibles/collectibleManager.js';
import { LANES, GITHUB_PROFILE_ITEM_CHANCE } from '../core/constants.js';
import gameState, { 
    loadHighScore, 
    loadMusicPreferences,
    saveMusicPreferences,
    startGame
} from '../state/gameState.js';
import { initInputHandling } from './inputHandler.js';
import { initAnimationLoop } from './animationLoop.js';

// Data collections
let githubRepos = [];
let profileData = [];

// UI elements
let musicToggleButton;

/**
 * Initialize the game
 * @returns {Promise} A promise that resolves when initialization is complete
 */
export async function initGame() {
    console.log('Initializing game...');
    
    // Initialize scene, camera, renderer, and environment
    sceneManager.init();
    
    // Create player
    const player = initializePlayer(sceneManager.scene, gameState.currentLane);
    
    // Initialize audio system
    initAudio();
    setupAudioControls();
    
    // Add event listeners for player input
    initInputHandling(
        gameState,
        player,
        () => refreshGame(player),
        updateMusicToggleButton,
        unlockAudio
    );
    
    // Handle window resize
    window.addEventListener('resize', sceneManager.onWindowResize.bind(sceneManager));
    
    // Load saved preferences
    loadHighScore();
    const musicEnabled = loadMusicPreferences();
    updateMusicToggleButton(musicEnabled);
    
    // Start the game
    startGame();
    
    // Hide the start screen immediately
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('hidden');
    }
    
    // Flash the grid immediately when the page loads for emphasis
    setTimeout(() => sceneManager.flashGrid(), 500);
    
    // Start with a single collectible
    setTimeout(() => {
        // Create it far enough away to give player time to prepare
        const collectible = createCollectible(gameState.currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
        addCollectible(collectible, sceneManager.scene);
        
        // Position the initial collectible at a comfortable distance
        collectible.position.z = -30;
        collectible.position.x = LANES[1]; // Center lane
    }, 100);
    
    // Set up a user interaction handler to start music
    setupMusicAutostart();
    
    // Load GitHub data
    window._gitHubProfileItemChance = GITHUB_PROFILE_ITEM_CHANCE;
    await loadGitHubData();
    
    // Start animation loop
    const animate = initAnimationLoop(sceneManager, player, githubRepos, profileData);
    animate();
    
    return {
        player,
        sceneManager,
        githubRepos,
        profileData
    };
}

/**
 * Set up handlers to start music after user interaction (for browser autoplay policy)
 */
function setupMusicAutostart() {
    // Set up a user interaction handler to start music
    // This handles browsers' autoplay policy restrictions
    const startMusicOnInteraction = () => {
        // Unlock audio context first (important for iOS)
        unlockAudio();
        
        if (gameState.musicEnabled) {
            console.log("Starting music after user interaction");
            startMusic();
        }
        
        // Remove the event listeners after first interaction
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('keydown', startMusicOnInteraction);
        window.removeEventListener('touchstart', startMusicOnInteraction);
    };
    
    // Add event listeners for all types of user interaction
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    window.addEventListener('touchstart', startMusicOnInteraction);
    
    // Also attempt to start music with timeout, but this may not work
    // due to browser autoplay policies
    if (gameState.musicEnabled) {
        setTimeout(() => {
            startMusic();
        }, 1000);
    }
}

/**
 * Set up audio controls
 */
function setupAudioControls() {
    // Get music toggle button
    musicToggleButton = document.getElementById('music-toggle');
    
    // Add click event listener to toggle music
    if (musicToggleButton) {
        musicToggleButton.addEventListener('click', () => {
            // Unlock audio first (important for iOS and mobile browsers)
            unlockAudio();
            
            gameState.musicEnabled = toggleMusic();
            updateMusicToggleButton();
            
            // Save preference
            saveMusicPreferences();
        });
    }
    
    // Set initial state
    updateMusicToggleButton();
}

/**
 * Update music toggle button appearance
 */
function updateMusicToggleButton() {
    if (!musicToggleButton) return;
    
    if (gameState.musicEnabled) {
        musicToggleButton.classList.remove('disabled');
    } else {
        musicToggleButton.classList.add('disabled');
    }
}

/**
 * Load GitHub repository and profile data
 * @returns {Promise} A promise that resolves when data is loaded
 */
async function loadGitHubData() {
    try {
        // Use Promise.all to load both data types in parallel
        const [repos, profile] = await Promise.all([
            fetchGitHubRepos(),
            fetchGitHubProfileData()
        ]);
        
        // Store the GitHub repos data
        githubRepos = repos;
        console.log('Loaded GitHub repos:', githubRepos.length);
        
        // Log each repo for debugging
        if (githubRepos.length > 0) {
            console.log('First few repos:', githubRepos.slice(0, 3).map(repo => 
                `${repo.name} (${repo.language || 'No language'}) - ${repo.description || 'No description'}`
            ));
        } else {
            console.error('No GitHub repos were loaded!');
        }
        
        // Store the profile data
        profileData = processGitHubProfileData(profile);
        console.log('Loaded GitHub profile data items:', profileData.length);
        
        return { githubRepos, profileData };
    } catch (error) {
        console.error('Error loading GitHub data:', error);
        return { githubRepos: [], profileData: [] };
    }
}

/**
 * Refresh the game
 * @param {Object} player - The player object
 */
export function refreshGame(player) {
    // Reset game state but don't stop gameplay
    gameState.resetGame();
    
    // Clear collectibles
    clearCollectibles(sceneManager.scene);
    
    // Reset player position to current lane
    player.position.set(LANES[gameState.currentLane], player.position.y, 0);
    player.rotation.set(0, 0, 0);
    
    // Flash grid for visual effect after a small delay
    setTimeout(() => {
        sceneManager.flashGrid();
    }, 100);
    
    // Start with just a single collectible to avoid initial slowdown
    // Create it far enough away to give player time to prepare
    const collectible = createCollectible(gameState.currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
    addCollectible(collectible, sceneManager.scene);
    
    // Position the initial collectible at a comfortable distance
    collectible.position.z = -30;
    collectible.position.x = LANES[1]; // Center lane
    
    // Reset the last collectible time
    gameState.lastCollectibleTime = Date.now();
    
    // Restart music if enabled but not playing
    if (gameState.musicEnabled) {
        startMusic();
    }
}