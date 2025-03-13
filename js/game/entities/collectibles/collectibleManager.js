/**
 * Collectible Manager - Handles collectible management
 */
import { PLAYER_SIZE } from '../../core/constants.js';
import { createCollectionEffect } from './collectibleEffects.js';

// Collection of active collectibles in the game
let collectibles = [];

// Track the last displayed item to avoid showing the same text twice in a row
let lastDisplayedItemId = null;

/**
 * Add a collectible to the game
 * @param {THREE.Object3D} collectible - The collectible to add
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function addCollectible(collectible, scene) {
    scene.add(collectible);
    collectibles.push(collectible);
}

/**
 * Update all collectibles (movement, animation)
 * @param {number} speed - The speed at which collectibles move
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function updateCollectibles(speed, scene) {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        try {
            const collectible = collectibles[i];
            collectible.position.z += speed;
            
            // Check for special animation function
            if (collectible.userData && collectible.userData.animate) {
                collectible.userData.animate(Date.now());
            } else {
                // Different animation based on collectible type
                collectible.rotation.y += 0.02;
            }
            
            // Floating effect
            collectible.position.y = 0.5 + Math.sin(Date.now() * 0.002 + collectible.position.x) * 0.2;
        } catch (err) {
            console.error('Error updating collectible:', err);
            // Remove problematic collectible
            if (collectibles[i]) {
                try {
                    scene.remove(collectibles[i]);
                } catch (e) {
                    // Ignore further errors
                }
                collectibles.splice(i, 1);
            }
        }
    }
}

/**
 * Check collisions between player and collectibles
 * @param {THREE.Object3D} player - The player object
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Function} flashGrid - Function to flash the grid
 * @param {Array} explodingTexts - Array to store exploding text particles
 * @param {Array} gitHubRepos - GitHub repositories 
 * @param {Array} profileData - Profile data
 */
export function checkCollisions(player, scene, flashGrid, explodingTexts, gitHubRepos, profileData) {
    // Reset game state each time to ensure we can always show repos
    window.gameState = {
        isShowingRepo: false,
        lastRepoShownTime: 0
    };
    
    // Debug log the available data
    if (gitHubRepos && gitHubRepos.length > 0) {
        console.log(`Available GitHub repos: ${gitHubRepos.length}`);
    }
    
    if (profileData && profileData.length > 0) {
        console.log(`Available profile items: ${profileData.length}`);
    }
    
    // Check collectible collisions
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];
        
        // Check if collectible is too far behind
        if (collectible.position.z > 10) {
            scene.remove(collectible);
            collectibles.splice(i, 1);
            continue;
        }
        
        // Check for collectible pickup
        const distance = player.position.distanceTo(collectible.position);
        if (distance < PLAYER_SIZE + 0.7) {
            // Always show repos by forcing shouldShowRepo to true
            const shouldShowRepo = true;
            
            // Store this collectible's data for proper tracking
            if (collectible.userData && collectible.userData.dataItem) {
                // Reset last displayed item tracking to make sure we get fresh content
                if (lastDisplayedItemId && lastDisplayedItemId === collectible.userData.dataItem.name) {
                    // If showing the same item, force a reset 
                    lastDisplayedItemId = null;
                }
            }
            
            // Create collection effect with repo display
            createCollectionEffect(
                collectible.position.x, 
                collectible.position.y, 
                collectible.position.z, 
                shouldShowRepo,
                scene,
                explodingTexts,
                gitHubRepos,
                profileData
            );
            
            // Remove collectible
            scene.remove(collectible);
            collectibles.splice(i, 1);
            
            // Occasionally flash grid for visual interest
            if (Math.random() < 0.2) { // 20% chance on collection
                flashGrid();
            }
        }
    }
}

/**
 * Clear all collectibles from the scene
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function clearCollectibles(scene) {
    for (const collectible of collectibles) {
        scene.remove(collectible);
    }
    collectibles = [];
}

/**
 * Get the last displayed item ID
 * @returns {string|null} The ID of the last displayed item
 */
export function getLastDisplayedItemId() {
    return lastDisplayedItemId;
}

/**
 * Set the last displayed item ID
 * @param {string} id - The ID to set
 */
export function setLastDisplayedItemId(id) {
    lastDisplayedItemId = id;
}

/**
 * Get all active collectibles
 * @returns {Array} The array of collectibles
 */
export function getCollectibles() {
    return collectibles;
}

export default {
    addCollectible,
    updateCollectibles,
    checkCollisions,
    clearCollectibles,
    getLastDisplayedItemId,
    setLastDisplayedItemId,
    getCollectibles
};