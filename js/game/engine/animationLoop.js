/**
 * Animation Loop - Manages the game animation loop
 */
import { PLAYER_SPEED, MAX_TIME_BETWEEN_COLLECTIBLES, LANES } from '../core/constants.js';
import { updatePlayer } from '../entities/player.js';
import { updateCollectibles, checkCollisions } from '../entities/collectibles/collectibleManager.js';
import { createCollectible } from '../entities/collectibles/collectibleFactory.js';
import { addCollectible } from '../entities/collectibles/collectibleManager.js';
import gameState from '../state/gameState.js';

// Game objects collections
let obstacles = [];
let explodingTexts = [];

/**
 * Initialize the animation loop
 * @param {Object} sceneManager - The scene manager
 * @param {Object} player - The player object
 * @param {Array} githubRepos - GitHub repositories
 * @param {Array} profileData - Profile data
 * @returns {Function} - The animation loop function
 */
export function initAnimationLoop(sceneManager, player, githubRepos, profileData) {
    /**
     * Animation loop function
     */
    return function animate() {
        try {
            gameState.animationId = requestAnimationFrame(animate);
            
            // Track current time for guaranteed collectible spawns
            const currentTime = Date.now();
            
            // Update environment (grid movement, sun rotation, etc.)
            sceneManager.updateEnvironment(gameState.gameStarted, PLAYER_SPEED);
            
            // Update exploding text particles
            updateExplodingTexts(sceneManager, explodingTexts);
            
            if (gameState.gameStarted) {
                // Update player
                updatePlayer(player, gameState.currentLane);
                
                // Move obstacles
                updateObstacles(sceneManager, obstacles);
                
                // Update collectibles
                updateCollectibles(PLAYER_SPEED, sceneManager.scene);
                
                // Create collectibles with controlled timing
                createNewCollectibles(
                    sceneManager,
                    currentTime,
                    gameState.lastCollectibleTime,
                    githubRepos,
                    profileData
                );
                
                // Check collisions
                checkCollisions(
                    player,
                    sceneManager.scene,
                    sceneManager.flashGrid.bind(sceneManager),
                    explodingTexts,
                    githubRepos,
                    profileData
                );
            }
            
            // Render the scene
            sceneManager.render();
            
        } catch (err) {
            console.error('Critical error in animation loop:', err);
            // Try to recover by requesting next frame
            requestAnimationFrame(animate);
        }
    };
}

/**
 * Update exploding text particles
 * @param {Object} sceneManager - The scene manager
 * @param {Array} explodingTexts - Array of exploding text particles
 */
function updateExplodingTexts(sceneManager, explodingTexts) {
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
}

/**
 * Update obstacles
 * @param {Object} sceneManager - The scene manager
 * @param {Array} obstacles - Array of obstacles
 */
function updateObstacles(sceneManager, obstacles) {
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
}

/**
 * Create new collectibles based on game state
 * @param {Object} sceneManager - The scene manager
 * @param {number} currentTime - Current time
 * @param {number} lastCollectibleTime - Time when last collectible was created
 * @param {Array} githubRepos - GitHub repositories
 * @param {Array} profileData - Profile data
 */
function createNewCollectibles(sceneManager, currentTime, lastCollectibleTime, githubRepos, profileData) {
    try {
        // Check current number of collectibles
        const collectibles = sceneManager.scene.children.filter(c => {
            // Only count collectibles that are ahead of the player (not yet passed)
            return c && c.userData && c.userData.dataSource && c.position && c.position.z < 0;
        });
        
        // More permissive rules for creating collectibles:
        // 1. Allow up to 3 collectibles ahead of the player
        // 2. Shorter time between collectible creation
        // 3. Higher random chance (30%) to create more collectibles
        const timeSinceLastCollectible = currentTime - lastCollectibleTime;
        
        if (collectibles.length < 3 && 
            timeSinceLastCollectible > MAX_TIME_BETWEEN_COLLECTIBLES && 
            (Math.random() < 0.3 || collectibles.length === 0)) {
            
            console.log("Creating new collectible. Current count:", collectibles.length);
            
            // Randomly alternate between GitHub repos and profile data (50/50 chance)
            const useGitHubRepo = Math.random() < 0.5;
            
            // Set chance to 0.5 for a balanced mix of GitHub and resume data
            const chanceToUse = 0.5;
            
            // Create collectible with controlled type distribution
            const collectible = createCollectible(gameState.currentLane, profileData, githubRepos, chanceToUse);
            addCollectible(collectible, sceneManager.scene);
            
            // Debug what type of collectible we're creating
            console.log("Collectible type:", useGitHubRepo ? "GitHub Repo" : "Profile Data");
            
            // Position closer to make them appear more frequently
            collectible.position.z = -30 - (Math.random() * 10);
            
            // Randomly select one of the three lanes
            const randomLane = Math.floor(Math.random() * LANES.length);
            collectible.position.x = LANES[randomLane];
            console.log("Positioning collectible in lane", randomLane, "at x =", LANES[randomLane]);
            
            // Update the last collectible time
            gameState.lastCollectibleTime = currentTime;
        }
    } catch (err) {
        console.error('Error in creating collectibles:', err);
    }
}

export default {
    initAnimationLoop,
    obstacles,
    explodingTexts
};