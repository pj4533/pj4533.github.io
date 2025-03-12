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

import { 
    PLAYER_SPEED, 
    LANES, 
    DEFAULT_LANE,
    GITHUB_PROFILE_ITEM_CHANCE,
    MAX_TIME_BETWEEN_COLLECTIBLES
} from './core/constants.js';

// Game state variables
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;
let level = 1;
let currentLane = DEFAULT_LANE;
let lastCollectibleTime = 0;
let animationId;

// Game objects collections
let player;
let obstacles = [];
let collectibles = [];
let explodingTexts = [];

// GitHub data
let githubRepos = [];
let profileData = [];

// Initialize game components
async function initGame() {
    console.log('Initializing game...');
    
    // Initialize scene, camera, renderer, and environment
    sceneManager.init();
    
    // Create player
    player = initializePlayer(sceneManager.scene, currentLane);
    
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
    } catch (err) {
        console.error('Error loading high score:', err);
    }
    
    // Start animation loop
    animate();
    
    // Flash the grid immediately when the page loads for emphasis
    setTimeout(() => sceneManager.flashGrid(), 500);
    
    // Load GitHub data
    window._gitHubProfileItemChance = GITHUB_PROFILE_ITEM_CHANCE;
    
    fetchGitHubRepos().then(repos => {
        githubRepos = repos;
        console.log('Loaded GitHub repos:', githubRepos.length);
    });
    
    fetchGitHubProfileData().then(profile => {
        profileData = processGitHubProfileData(profile);
        console.log('Loaded GitHub profile data items:', profileData.length);
    });
}

// Handle keyboard input
function handleKeyDown(event) {
    // Prevent default action for arrow keys and space
    if (event.key === ' ' || 
        event.key === 'ArrowLeft' || 
        event.key === 'ArrowRight' || 
        event.key === 'ArrowUp' || 
        event.key === 'ArrowDown') {
        event.preventDefault();
    }
    
    // Handle spacebar to start the game
    if (event.key === ' ') {
        if (!gameStarted) {
            startGame();
            return;
        }
    }
    
    // Add R key to refresh the game and repos
    if (event.key === 'r' || event.key === 'R') {
        if (gameStarted) {
            refreshGame();
            return;
        }
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
    
    // Only create a small number of initial collectibles
    // The rest will be dynamically created during gameplay
    for (let i = 0; i < 5; i++) {
        // Create collectible with random properties
        const collectible = createCollectible(currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
        addCollectible(collectible, sceneManager.scene);
        
        // Position collectibles randomly but ensure they're spread out
        collectible.position.z = -15 - (i * 5) - (Math.random() * 5); // More space between collectibles
        collectible.position.x = LANES[Math.floor(Math.random() * LANES.length)]; // Random lane
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
    
    // Only create a small number of initial collectibles
    // The rest will be dynamically created during gameplay
    for (let i = 0; i < 5; i++) {
        // Create collectible with random properties
        const collectible = createCollectible(currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
        addCollectible(collectible, sceneManager.scene);
        
        // Position collectibles randomly but ensure they're spread out
        collectible.position.z = -15 - (i * 5) - (Math.random() * 5); // More space between collectibles
        collectible.position.x = LANES[Math.floor(Math.random() * LANES.length)]; // Random lane
    }
    
    // Reset the last collectible time
    lastCollectibleTime = Date.now();
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
            
            // Create collectibles - more dynamically during gameplay
            try {
                // Check if it's been too long since the last collectible was created
                const timeSinceLastCollectible = currentTime - lastCollectibleTime;
                
                // Create collectibles based on:
                // 1. Random chance (lower than before to avoid too many collectibles)
                // 2. Force creation if it's been too long
                // 3. Keep a minimum number of collectibles in the scene
                if (Math.random() < 0.30 || 
                    timeSinceLastCollectible > MAX_TIME_BETWEEN_COLLECTIBLES || 
                    collectibles.length < 3) {
                    
                    // Create a collectible with random properties
                    const collectible = createCollectible(currentLane, profileData, githubRepos, window._gitHubProfileItemChance);
                    addCollectible(collectible, sceneManager.scene);
                    
                    // Position the collectible randomly
                    // - Further away from the player (z between -30 and -50)
                    // - In a random lane
                    collectible.position.z = -30 - (Math.random() * 20);
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
    refreshGame
};