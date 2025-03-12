/**
 * NEON WAVE Game - Main Entry Point
 * Imports and initializes all game components
 */
import { sceneManager } from './core/setup.js';
import { initializePlayer, updatePlayer, handlePlayerMovement } from './entities/player.js';
import { 
    createCollectible, 
    addCollectible, 
    updateCollectibles, 
    checkCollisions, 
    clearCollectibles 
} from './entities/collectible.js';
import { fetchGitHubRepos } from './data/github.js';
import { fetchGitHubProfileData, processGitHubProfileData } from './data/profile.js';
import { initAudio, startMusic, stopMusic, toggleMusic, setMusicVolume, unlockAudio } from './core/audio.js';

import { 
    PLAYER_SPEED, 
    LANES, 
    DEFAULT_LANE,
    GITHUB_PROFILE_ITEM_CHANCE,
    MAX_TIME_BETWEEN_COLLECTIBLES,
    DEFAULT_MUSIC_ENABLED,
    DEFAULT_MUSIC_VOLUME
} from './core/constants.js';

// Game state variables
let gameStarted = true; // Start game immediately
let gameOver = false;
let score = 0;
let highScore = 0;
let level = 1;
let currentLane = DEFAULT_LANE;
let lastCollectibleTime = 0;
let animationId;
let musicEnabled = DEFAULT_MUSIC_ENABLED;

// Game objects collections
let player;
let obstacles = [];
let collectibles = [];
let explodingTexts = [];

// GitHub data
let githubRepos = [];
let profileData = [];

// Audio elements
let musicToggleButton;

// Initialize game components
async function initGame() {
    console.log('Initializing game...');
    
    // Initialize scene, camera, renderer, and environment
    sceneManager.init();
    
    // Create player
    player = initializePlayer(sceneManager.scene, currentLane);
    
    // Initialize audio system
    initAudio();
    setupAudioControls();
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', sceneManager.onWindowResize.bind(sceneManager));
    
    // Initialize UI elements
    updateScore(0);
    
    // Load high score from localStorage
    try {
        if (localStorage.getItem('neonWaveHighScore')) {
            highScore = parseInt(localStorage.getItem('neonWaveHighScore'));
            console.log('Loaded high score:', highScore);
        }
        
        // Load music preference from localStorage
        if (localStorage.getItem('neonWaveMusicEnabled') !== null) {
            musicEnabled = localStorage.getItem('neonWaveMusicEnabled') === 'true';
            updateMusicToggleButton();
        }
    } catch (err) {
        console.error('Error loading saved preferences:', err);
    }
    
    // Start animation loop
    animate();
    
    // Hide the start screen immediately
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('hidden');
    }
    
    // Initialize the last collectible time
    lastCollectibleTime = Date.now();
    
    // Flash the grid immediately when the page loads for emphasis
    setTimeout(() => sceneManager.flashGrid(), 500);
    
    // Start with a single collectible
    setTimeout(() => {
        // Create it far enough away to give player time to prepare
        const collectible = createCollectible(currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
        addCollectible(collectible, sceneManager.scene);
        
        // Position the initial collectible at a comfortable distance
        collectible.position.z = -30;
        collectible.position.x = LANES[1]; // Center lane
    }, 100);
    
    // Set up a user interaction handler to start music
    // This handles browsers' autoplay policy restrictions
    const startMusicOnInteraction = () => {
        // Unlock audio context first (important for iOS)
        unlockAudio();
        
        if (musicEnabled) {
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
    if (musicEnabled) {
        setTimeout(() => {
            startMusic();
        }, 1000);
    }
    
    // Load GitHub data - log detailed information to help debug
    window._gitHubProfileItemChance = GITHUB_PROFILE_ITEM_CHANCE;
    
    // Use Promise.all to load both data types in parallel
    Promise.all([
        fetchGitHubRepos(),
        fetchGitHubProfileData()
    ]).then(([repos, profile]) => {
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
    }).catch(error => {
        console.error('Error loading GitHub data:', error);
    });
}

// Set up audio controls
function setupAudioControls() {
    // Get music toggle button
    musicToggleButton = document.getElementById('music-toggle');
    
    // Add click event listener to toggle music
    if (musicToggleButton) {
        musicToggleButton.addEventListener('click', () => {
            // Unlock audio first (important for iOS and mobile browsers)
            unlockAudio();
            
            musicEnabled = toggleMusic();
            updateMusicToggleButton();
            
            // Save preference
            try {
                localStorage.setItem('neonWaveMusicEnabled', musicEnabled.toString());
            } catch (err) {
                console.error('Error saving music preference:', err);
            }
        });
    }
    
    // Set initial state
    updateMusicToggleButton();
}

// Update music toggle button appearance
function updateMusicToggleButton() {
    if (!musicToggleButton) return;
    
    if (musicEnabled) {
        musicToggleButton.classList.remove('disabled');
    } else {
        musicToggleButton.classList.add('disabled');
    }
}

// Handle keyboard input
function handleKeyDown(event) {
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
        if (gameStarted) {
            refreshGame();
            return;
        }
    }
    
    // Toggle music with M key
    if (event.key === 'm' || event.key === 'M') {
        // Unlock audio first (needed for iOS and some browsers)
        unlockAudio();
        
        musicEnabled = toggleMusic();
        updateMusicToggleButton();
        
        // Save preference
        try {
            localStorage.setItem('neonWaveMusicEnabled', musicEnabled.toString());
        } catch (err) {
            console.error('Error saving music preference:', err);
        }
        return;
    }
    
    // Only handle movement if game is active
    if (!gameStarted) return;
    
    // Handle player movement using the player module
    currentLane = handlePlayerMovement(event, player, currentLane);
}

// Update score display
function updateScore(newScore) {
    score = newScore;
}

// Start the game
function startGame() {
    console.log("Starting game!");
    
    // Make sure the game hasn't already started
    if (gameStarted) return;
    
    // Set game state
    gameStarted = true;
    gameOver = false;
    
    // Hide the start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('hidden');
        console.log("Start screen hidden:", startScreen.classList.contains('hidden'));
    } else {
        console.error("Start screen element not found!");
    }
    
    updateScore(0);
    
    // Initialize the last collectible time to ensure timely collectible creation
    lastCollectibleTime = Date.now();
    
    // Delay the grid flash to give the game time to initialize
    setTimeout(() => {
        sceneManager.flashGrid();
    }, 500);
    
    // Start with just a single collectible to avoid initial slowdown
    // Create it far enough away to give player time to prepare
    const collectible = createCollectible(currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
    addCollectible(collectible, sceneManager.scene);
    
    // Position the initial collectible at a comfortable distance
    collectible.position.z = -30;
    collectible.position.x = LANES[1]; // Center lane
    
    // Start music if enabled
    if (musicEnabled) {
        startMusic();
    }
}

// Refresh the game
function refreshGame() {
    // Reset basic game parameters but don't stop gameplay
    const speed = PLAYER_SPEED;
    level = 1;
    
    // Clear obstacles and collectibles
    for (const obstacle of obstacles) {
        sceneManager.scene.remove(obstacle);
    }
    obstacles = [];
    
    clearCollectibles(sceneManager.scene);
    
    // Reset player position to current lane
    player.position.set(LANES[currentLane], player.position.y, 0);
    player.rotation.set(0, 0, 0);
    
    // Reset score
    updateScore(0);
    
    // Flash grid for visual effect after a small delay
    setTimeout(() => {
        sceneManager.flashGrid();
    }, 100);
    
    // Start with just a single collectible to avoid initial slowdown
    // Create it far enough away to give player time to prepare
    const collectible = createCollectible(currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
    addCollectible(collectible, sceneManager.scene);
    
    // Position the initial collectible at a comfortable distance
    collectible.position.z = -30;
    collectible.position.x = LANES[1]; // Center lane
    
    // Reset the last collectible time
    lastCollectibleTime = Date.now();
    
    // Restart music if enabled but not playing
    if (musicEnabled) {
        startMusic();
    }
}

// Animation loop
function animate() {
    try {
        animationId = requestAnimationFrame(animate);
        
        // Track current time for guaranteed collectible spawns
        const currentTime = Date.now();
        
        // Update environment (grid movement, sun rotation, etc.)
        sceneManager.updateEnvironment(gameStarted, PLAYER_SPEED);
        
        // Update exploding text particles
        for (let i = explodingTexts.length - 1; i >= 0; i--) {
            try {
                const textParticle = explodingTexts[i];
                if (!textParticle || !textParticle.update) {
                    // Invalid particle, remove it
                    if (textParticle && textParticle.mesh) {
                        sceneManager.scene.remove(textParticle.mesh);
                    }
                    explodingTexts.splice(i, 1);
                    continue;
                }
                
                const isAlive = textParticle.update();
                
                if (!isAlive) {
                    // Remove dead particles from scene and array
                    if (textParticle.mesh) {
                        sceneManager.scene.remove(textParticle.mesh);
                    }
                    explodingTexts.splice(i, 1);
                }
            } catch (err) {
                console.error('Error updating text particle:', err);
                // Remove problematic particle
                try {
                    if (explodingTexts[i] && explodingTexts[i].mesh) {
                        sceneManager.scene.remove(explodingTexts[i].mesh);
                    }
                } catch (e) {
                    // Ignore further errors in cleanup
                }
                explodingTexts.splice(i, 1);
            }
        }
        
        if (gameStarted) {
            // Update player
            updatePlayer(player, currentLane);
            
            // Move obstacles
            for (let i = obstacles.length - 1; i >= 0; i--) {
                try {
                    const obstacle = obstacles[i];
                    obstacle.position.z += PLAYER_SPEED;
                    
                    // Different rotation effects based on obstacle type
                    if (obstacle.children && obstacle.children[0] && obstacle.children[0].geometry) {
                        obstacle.rotation.z += 0.03;
                    }
                    
                    // Remove obstacles that are too far behind
                    if (obstacle.position.z > 10) {
                        sceneManager.scene.remove(obstacle);
                        obstacles.splice(i, 1);
                    }
                } catch (err) {
                    console.error('Error updating obstacle:', err);
                    if (obstacles[i]) {
                        try {
                            sceneManager.scene.remove(obstacles[i]);
                        } catch (e) {
                            // Ignore further errors
                        }
                        obstacles.splice(i, 1);
                    }
                }
            }
            
            // Update collectibles
            updateCollectibles(PLAYER_SPEED, sceneManager.scene);
            
            // Create collectibles - extremely conservative approach
            try {
                // Check current number of collectibles
                const visibleCollectibles = collectibles.filter(c => {
                    // Only count collectibles that are ahead of the player (not yet passed)
                    return c.position.z < 0;
                });
                
                // More permissive rules for creating collectibles:
                // 1. Allow up to 3 collectibles ahead of the player
                // 2. Shorter time between collectible creation
                // 3. Higher random chance (30%) to create more collectibles
                const timeSinceLastCollectible = currentTime - lastCollectibleTime;
                
                if (visibleCollectibles.length < 3 && 
                    timeSinceLastCollectible > MAX_TIME_BETWEEN_COLLECTIBLES && 
                    (Math.random() < 0.3 || visibleCollectibles.length === 0)) {
                    
                    console.log("Creating new collectible. Current count:", visibleCollectibles.length);
                    
                    // Randomly alternate between GitHub repos and profile data (50/50 chance)
                    const useGitHubRepo = Math.random() < 0.5;
                    
                    // Set chance to 0.5 for a balanced mix of GitHub and resume data
                    const chanceToUse = 0.5;
                    
                    // Create collectible with controlled type distribution
                    const collectible = createCollectible(currentLane, profileData, githubRepos, chanceToUse);
                    addCollectible(collectible, sceneManager.scene);
                    
                    // Debug what type of collectible we're creating
                    console.log("Collectible type:", useGitHubRepo ? "GitHub Repo" : "Profile Data");
                    
                    // Position closer to make them appear more frequently
                    collectible.position.z = -30 - (Math.random() * 10);
                    
                    // Randomly select one of the three lanes
                    collectible.position.x = LANES[Math.floor(Math.random() * LANES.length)];
                    
                    // Update the last collectible time
                    lastCollectibleTime = currentTime;
                }
                
                // Check collisions
                checkCollisions(player, sceneManager.scene, sceneManager.flashGrid.bind(sceneManager), explodingTexts, githubRepos, profileData);
            } catch (err) {
                console.error('Error in game logic:', err);
            }
        }
        
        // Render the scene
        sceneManager.render();
        
    } catch (err) {
        console.error('Critical error in animation loop:', err);
        // Try to recover by requesting next frame
        requestAnimationFrame(animate);
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initGame);

// Export for use in other modules
export {
    gameStarted,
    gameOver,
    score,
    highScore,
    level,
    currentLane,
    player,
    obstacles,
    collectibles,
    explodingTexts,
    githubRepos,
    profileData,
    sceneManager,
    startGame,
    refreshGame,
    musicEnabled,
    toggleMusic,
    setMusicVolume
};