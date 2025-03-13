/**
 * Collectible Factory - Creates collectible objects
 */
import { 
    LANES, 
    NEON_COLORS, 
    COLLECTIBLE_Z_POSITION, 
    COLLECTIBLE_SCALE, 
    GITHUB_COLOR, 
    GITHUB_DARK_COLOR, 
    RESUME_COLOR, 
    RESUME_DARK_COLOR 
} from '../../core/constants.js';
import { getLastDisplayedItemId, setLastDisplayedItemId } from './collectibleManager.js';
import { createStandardCollectible } from './standardCollectibles.js';
import { createProfileCollectible } from './profileCollectibles.js';

/**
 * Create a new collectible item in the game
 * @param {number} currentLane - Current lane index for collectible placement
 * @param {Array} profileData - GitHub profile data
 * @param {Array} githubRepos - GitHub repositories data
 * @param {number} gitHubProfileItemChance - Chance of creating profile item vs repo
 * @returns {THREE.Object3D} - The created collectible object
 */
export function createCollectible(currentLane, profileData, githubRepos, gitHubProfileItemChance) {
    // Don't create any collectibles if we don't have data
    if ((!profileData || profileData.length === 0) && (!githubRepos || githubRepos.length === 0)) {
        console.log("No data available, skipping collectible creation");
        return null;
    }
    
    const lane = Math.floor(Math.random() * 3);
    
    // Determine if this should be a GitHub profile collectible
    // Always use profile items if we have them available (force balanced distribution)
    const isProfileItem = profileData && profileData.length > 0 && Math.random() < gitHubProfileItemChance;
    
    // For standard collectibles, choose a random type
    const collectibleType = Math.floor(Math.random() * 4);
    
    let collectible;
    const colorIndex = Math.floor(Math.random() * NEON_COLORS.length);
    const itemColor = isProfileItem ? GITHUB_COLOR : NEON_COLORS[colorIndex]; // GitHub green for profile items
    
    // Store the data source and item in the collectible's userData
    const collectibleUserData = {};
    
    if (isProfileItem) {
        // Choose a random profile data item if available
        if (profileData && profileData.length > 0) {
            // Filter profile items to include GitHub and resume items separately
            const resumeItems = profileData.filter(item => item.source === 'resume');
            const githubItems = profileData.filter(item => item.source !== 'resume');
            
            // Randomly choose between resume (50% chance) or GitHub (50% chance) when both are available
            let selectedItems = resumeItems.length > 0 && (Math.random() < 0.5 || githubItems.length === 0) ? 
                            resumeItems : githubItems;
                            
            // Make sure we have something to select from
            if (selectedItems.length === 0) {
                selectedItems = profileData; // Fall back to all items if the filtered array is empty
            }
            
            // Choose a random item from the selected items, avoiding the last displayed item
            let attempts = 0;
            let selectedItem;
            
            do {
                const randomIndex = Math.floor(Math.random() * selectedItems.length);
                selectedItem = selectedItems[randomIndex];
                attempts++;
                
                // Break after a few attempts to avoid infinite loop with a small pool of items
                if (attempts > 5) break;
            } while (
                // Only avoid duplication if we have multiple items to choose from
                selectedItems.length > 1 && 
                getLastDisplayedItemId() && 
                (
                    // Check the ID first if available
                    (selectedItem.id && selectedItem.id === getLastDisplayedItemId()) ||
                    // Fall back to name comparison if no IDs
                    (!selectedItem.id && selectedItem.name === getLastDisplayedItemId())
                )
            );
            
            collectibleUserData.dataSource = 'profile';
            collectibleUserData.dataItem = selectedItem;
        } else {
            // If no profile data is available yet, just mark as profile source
            collectibleUserData.dataSource = 'profile';
            collectibleUserData.dataItem = {
                name: "Profile Data",
                description: "Loading profile data...",
                type: "profile",
                color: GITHUB_COLOR
            };
        }
        
        // Get the item to determine color
        const dataItem = collectibleUserData.dataItem;
        
        // Item should have a source property of 'resume'
        const isResumeItem = dataItem && dataItem.source === 'resume';
        
        // Create the appropriate collectible
        collectible = createProfileCollectible(isResumeItem);
        
        // Add special animation function for this collectible
        collectible.userData = {
            ...collectibleUserData,
            animate: function(time) {
                // Get the wireframe and inner parts from the group
                const parts = collectible.children;
                if (parts.length >= 2) {
                    // Rotate the wireframe and inner shape differently
                    parts[0].rotation.y += 0.01;
                    parts[1].rotation.y -= 0.005;
                    parts[1].rotation.x += 0.003;
                }
            }
        };
    } else {
        // For GitHub repo collectibles, store that this is a GitHub item
        collectibleUserData.dataSource = 'github';
        
        // Immediately assign a GitHub repo to this collectible
        if (githubRepos && githubRepos.length > 0) {
            // Try to avoid showing the same repo twice in a row
            let attempts = 0;
            let selectedRepo;
            
            do {
                const randomIndex = Math.floor(Math.random() * githubRepos.length);
                selectedRepo = githubRepos[randomIndex];
                attempts++;
                
                // Break after a few attempts to avoid infinite loop with a small pool of repos
                if (attempts > 5) break;
            } while (
                // Only avoid duplication if we have multiple repos to choose from
                githubRepos.length > 1 && 
                getLastDisplayedItemId() && 
                (
                    // Check the ID first if available
                    (selectedRepo.id && selectedRepo.id === getLastDisplayedItemId()) ||
                    // Fall back to name comparison if no IDs
                    (!selectedRepo.id && selectedRepo.name === getLastDisplayedItemId())
                )
            );
            
            collectibleUserData.dataItem = selectedRepo;
            console.log("Assigned GitHub repo:", collectibleUserData.dataItem.name);
        } else {
            console.log("No GitHub repos available to assign!");
        }
        
        // Create a standard collectible
        collectible = createStandardCollectible(collectibleType, itemColor);
    }
    
    // Position the collectible
    collectible.position.x = LANES[lane];
    collectible.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.2; // Floating effect
    
    // Scale up collectibles to make them much more visible
    collectible.scale.set(COLLECTIBLE_SCALE, COLLECTIBLE_SCALE, COLLECTIBLE_SCALE);
    
    // Position collectibles much closer to the player for frequent encounters
    collectible.position.z = COLLECTIBLE_Z_POSITION - Math.random() * 5; // Much closer to camera
    
    // Store user data in all collectible types
    try {
        // Initialize userData if it doesn't exist
        if (!collectible.userData) {
            collectible.userData = {};
        }
        
        // Add dataSource and dataItem if not already set
        if (!collectible.userData.dataSource) {
            collectible.userData.dataSource = collectibleUserData.dataSource || 'github';
        }
        
        // Make sure dataItem is properly set in userData for both standard collectibles and profile items
        if (collectibleUserData.dataItem && !collectible.userData.dataItem) {
            collectible.userData.dataItem = collectibleUserData.dataItem;
        }
    } catch (error) {
        console.error('Error setting collectible userData:', error);
    }
    
    return collectible;
}