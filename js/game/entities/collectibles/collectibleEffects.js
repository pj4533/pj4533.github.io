/**
 * Collectible Effects - Manages visual effects when collecting items
 */
import { RESUME_COLOR } from '../../core/constants.js';
import { createExplodingRepoText } from '../../effects/textEffects.js';
import { setLastDisplayedItemId, getCollectibles } from './collectibleManager.js';

/**
 * Create collection effect when player picks up collectible
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {boolean} showRepo - Whether to show repository info
 * @param {THREE.Scene} scene - The scene to add effects to
 * @param {Array} explodingTexts - Array to store exploding text particles
 * @param {Array} gitHubRepos - Array of GitHub repositories
 * @param {Array} profileData - Array of profile data items
 */
export function createCollectionEffect(x, y, z, showRepo, scene, explodingTexts, gitHubRepos, profileData) {
    // Create expanding ring (simplified geometry for performance)
    const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 16); // Reduced segments
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(x, y, z);
    ring.rotation.y = Math.PI / 2;
    scene.add(ring);
    
    // Create particles burst effect - fewer particles for better performance
    const particleCount = 6; // Further reduced for better performance
    const particles = [];
    
    // Reuse geometries and materials for better performance
    const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const particleMaterial1 = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 1
    });
    const particleMaterial2 = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 1
    });
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
            particleGeometry, 
            i % 2 === 0 ? particleMaterial1 : particleMaterial2
        );
        
        particle.position.set(x, y, z);
        particle.velocity = {
            x: (Math.random() - 0.5) * 0.1,
            y: (Math.random() - 0.5) * 0.1 + 0.05, // Slight upward bias
            z: (Math.random() - 0.5) * 0.1
        };
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Add point light flash
    const pointLight = new THREE.PointLight(0xffffff, 2, 5);
    pointLight.position.set(x, y, z);
    scene.add(pointLight);
    
    // Display collected item info if available AND if showRepo flag is true
    if (showRepo) {
        // Check if this collectible had specific data assigned to it
        // If we can identify what this collectible is, show that specific data
        let dataSource = 'github'; // Default to GitHub
        let dataItem = null;
        
        // Use the collectible's userData directly if possible
        try {
            // Try to get from the collectible that was just collected
            const collectibles = getCollectibles();
            const collectedItem = collectibles.find(c => 
                Math.abs(c.position.x - x) < 0.5 && 
                Math.abs(c.position.y - y) < 0.5 && 
                Math.abs(c.position.z - z) < 0.5
            );
            
            if (collectedItem && collectedItem.userData) {
                if (collectedItem.userData.dataSource) {
                    dataSource = collectedItem.userData.dataSource;
                }
                if (collectedItem.userData.dataItem) {
                    dataItem = collectedItem.userData.dataItem;
                }
            }
            
            // If we couldn't find the data from the collectible, pick a random item 
            // but ensure it's different from the previous one
            if (!dataItem) {
                const lastId = getLastDisplayedItemId();
                console.log("Last displayed item ID:", lastId);
                
                // Combine all available data for better randomization
                let allItems = [];
                
                // Add GitHub repos
                if (gitHubRepos && gitHubRepos.length > 0) {
                    // Map items to include source
                    const repoItems = gitHubRepos.map(repo => ({
                        ...repo, 
                        source: 'github'
                    }));
                    allItems = [...allItems, ...repoItems];
                }
                
                // Add profile data
                if (profileData && profileData.length > 0) {
                    allItems = [...allItems, ...profileData];
                }
                
                // Only proceed if we have items to choose from
                if (allItems.length > 0) {
                    // Filter out the last displayed item if possible
                    let availableItems = allItems;
                    
                    if (lastId && allItems.length > 1) {
                        availableItems = allItems.filter(item => 
                            (item.id && item.id !== lastId) || 
                            (!item.id && item.name !== lastId)
                        );
                    }
                    
                    // If filtering removed all items, revert to using all items
                    if (availableItems.length === 0) {
                        availableItems = allItems;
                    }
                    
                    // Get a truly random item
                    const randomIndex = Math.floor(Math.random() * availableItems.length);
                    dataItem = availableItems[randomIndex];
                    
                    // Set the data source based on the item
                    dataSource = dataItem.source === 'resume' || dataItem.source === 'profile' ? 
                        'profile' : 'github';
                    
                    console.log("Selected random item:", dataItem.name, "Source:", dataSource);
                }
                
                // Last resort - create a dummy item if nothing else works
                if (!dataItem) {
                    dataItem = {
                        name: "Resume Data",
                        description: "Professional Experience",
                        details: "Your resume data will appear here",
                        source: "resume",
                        type: "job_details",
                        color: RESUME_COLOR
                    };
                }
            }
        } catch (error) {
            console.error('Error accessing collectible userData:', error);
            // Fall back to creating a dummy item
            dataItem = {
                name: "Resume Data",
                description: "Professional Experience",
                details: "Error retrieving data, please try again",
                source: "resume",
                type: "job_details",
                color: RESUME_COLOR
            };
        }
        
        // Only display data items that have visual effects - no empty or placeholder items
        if (dataItem && 
            // Only show items that have meaningful content (name and one of: description, language, stars)
            dataItem.name) {
            
            // Ensure item has all necessary properties to avoid undefined values
            if (!dataItem.description) dataItem.description = "";
            if (!dataItem.details) dataItem.details = "";
            
            // Log what we're displaying to help debug
            console.log("Displaying collectible data:", {
                name: dataItem.name,
                type: dataItem.type || "unknown",
                source: dataItem.source || "unknown",
                description: dataItem.description || "none",
                details: dataItem.details || "none"
            });
            
            // Store the current item's ID to avoid repeating it next time
            if (dataItem.id) {
                setLastDisplayedItemId(dataItem.id);
            } else if (dataItem.name) {
                // If no ID exists, use the name as a fallback identifier
                setLastDisplayedItemId(dataItem.name);
            }
            
            // Log which item we're tracking to avoid repetition
            console.log("Tracking last displayed item:", dataItem.id || dataItem.name);
            
            // Force the popup to display by calling function directly - but only with 3D text effects
            createExplodingRepoText(new THREE.Vector3(x, y, z), dataItem, scene, explodingTexts);
        }
    }
    
    // Animate expanding ring and particles
    let scale = 0.1;
    const animate = () => {
        if (scale < 3) {
            // Animate ring
            scale += 0.15;
            ring.scale.set(scale, scale, scale);
            ring.material.opacity = 1 - scale / 3;
            ring.rotation.z += 0.02;
            
            // Animate particles
            particles.forEach(particle => {
                particle.position.x += particle.velocity.x;
                particle.position.y += particle.velocity.y;
                particle.position.z += particle.velocity.z;
                particle.material.opacity -= 0.02;
                particle.rotation.x += 0.1;
                particle.rotation.y += 0.1;
            });
            
            // Fade out light
            pointLight.intensity = 2 * (1 - scale / 3);
            
            requestAnimationFrame(animate);
        } else {
            // Clean up
            scene.remove(ring);
            particles.forEach(particle => scene.remove(particle));
            scene.remove(pointLight);
        }
    };
    
    animate();
}