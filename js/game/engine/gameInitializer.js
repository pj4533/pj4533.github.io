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
    
    // Initialize with minimum needed to start the visual experience
    sceneManager.initMinimal();
    
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
    
    // Set up GitHub data loading first, then start animation loop with data references
    window._gitHubProfileItemChance = GITHUB_PROFILE_ITEM_CHANCE;
    
    // Start with empty arrays - we'll only create collectibles once we have real data
    // This prevents showing error messages or placeholder data
    
    // Initialize with empty arrays
    // We'll only start showing collectibles once we have real data
    
    // Start animation loop with the arrays that will be updated later
    const animate = initAnimationLoop(sceneManager, player, githubRepos, profileData);
    animate();
    
    // Set up a user interaction handler to start music
    setupMusicAutostart();
    
    // Continue loading the rest of the scene assets after a short delay
    // This prevents multiple pauses by scheduling heavy operations
    setTimeout(() => {
        // Load road objects and more complex scene elements
        sceneManager.initRemainingAssets();
        
        // Start with a single collectible after GitHub data is loaded
        setTimeout(async () => {
            try {
                // Load GitHub data
                const { githubRepos: repos, profileData: profile } = await loadGitHubData();
                
                console.log("Loaded real GitHub data:", 
                    repos ? repos.length : 0, "repos", 
                    profile ? Object.keys(profile).length : 0, "profile items");
                
                // Make sure we have real data before clearing placeholders
                if (repos && repos.length > 0 && profile) {
                    // First, process the data directly
                    const processedRepos = repos;
                    const processedProfile = Array.isArray(profile) ? profile : processGitHubProfileData(profile);
                    
                    console.log("Processed profile data:", processedProfile.length, "items");
                    console.log("Sample profile item:", processedProfile.length > 0 ? processedProfile[0].name : "none");
                    
                    // Only clear if we actually have real data to replace with
                    if (processedRepos.length > 0 && processedProfile.length > 0) {
                        // Clear fallback data completely
                        githubRepos.splice(0, githubRepos.length);
                        profileData.splice(0, profileData.length);
                        
                        // Add real data to the arrays
                        githubRepos.push(...processedRepos);
                        profileData.push(...processedProfile);
                    }
                    
                    console.log("Updated arrays with real data:", 
                        githubRepos.length, "repos", 
                        profileData.length, "profile items");
                }
                
                console.log(`Loaded ${githubRepos.length} repos and ${profileData.length} profile items`);
            } catch (error) {
                console.error("Error loading GitHub data:", error);
            }
            
            // Create initial collectible only if we have data
            const collectible = createCollectible(gameState.currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
            
            // Only add the collectible if it was successfully created
            if (collectible) {
                addCollectible(collectible, sceneManager.scene);
                
                // Position the initial collectible at a comfortable distance
                collectible.position.z = -30;
                collectible.position.x = LANES[1]; // Center lane
            } else {
                console.log("Skipping initial collectible - no data available yet");
            }
        }, 1000);
    }, 200);
    
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
    // Set up a user interaction handler to unlock audio, but not start music
    // Music will only start when the user clicks the music button
    const startMusicOnInteraction = () => {
        // Unlock audio context first (important for iOS)
        unlockAudio();
        
        // Music is always disabled by default, so we don't start it automatically
        
        // Remove the event listeners after first interaction
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('keydown', startMusicOnInteraction);
        window.removeEventListener('touchstart', startMusicOnInteraction);
    };
    
    // Add event listeners for all types of user interaction
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    window.addEventListener('touchstart', startMusicOnInteraction);
    
    // Do not attempt to start music automatically - always require user action
    // Music is disabled by default
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
        
        // Process GitHub repos data - make sure we have real data
        let processedRepos = repos || [];
        if (processedRepos.length === 0) {
            console.error('No GitHub repos were loaded, using error message');
            processedRepos = [{
                name: "Error Loading Data",
                description: "Could not load GitHub repository data",
                language: "Error",
                color: 0xff0000
            }];
        } else {
            console.log('Loaded GitHub repos:', processedRepos.length);
            console.log('First repo:', processedRepos[0].name);
        }
        
        // Process profile data - make sure we get an array back
        let processedProfileData;
        if (profile) {
            processedProfileData = processGitHubProfileData(profile);
            console.log('Processed profile items:', processedProfileData.length);
            if (processedProfileData.length > 0) {
                console.log('First profile item:', processedProfileData[0].name);
            }
        } else {
            console.error('No profile data was loaded, using error message');
            processedProfileData = [{
                name: "Error Loading Data",
                description: "Could not load profile data",
                details: "Check console for more information",
                type: "error",
                color: 0xff0000
            }];
        }
        
        return { 
            githubRepos: processedRepos, 
            profileData: processedProfileData 
        };
    } catch (error) {
        console.error('Error loading GitHub data:', error);
        // Return clear error messages
        return { 
            githubRepos: [{
                name: "Error Loading Data",
                description: "Could not load GitHub repository data",
                language: "Error", 
                color: 0xff0000
            }], 
            profileData: [{
                name: "Error Loading Data",
                description: "Could not load profile data",
                details: "Check console for more information",
                type: "error",
                color: 0xff0000
            }]
        };
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