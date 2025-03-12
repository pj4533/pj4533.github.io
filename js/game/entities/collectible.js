/**
 * Collectibles module for NEON WAVE game
 */
import { LANES, NEON_COLORS, PLAYER_SIZE, COLLECTIBLE_Z_POSITION, COLLECTIBLE_SCALE, GITHUB_COLOR, GITHUB_DARK_COLOR, RESUME_COLOR, RESUME_DARK_COLOR } from '../core/constants.js';
import { createExplodingRepoText } from '../effects/textEffects.js';

// Collection of active collectibles in the game
let collectibles = [];

// Track the last collectible creation time
let lastCollectibleTime = 0;
const MAX_TIME_BETWEEN_COLLECTIBLES = 100; // Maximum 0.1 seconds between collectibles

// Track the last displayed item to avoid showing the same text twice in a row
let lastDisplayedItemId = null;

/**
 * Create a new collectible item in the game
 * @param {number} currentLane - Current lane index for collectible placement
 * @param {Array} profileData - GitHub profile data
 * @param {Array} githubRepos - GitHub repositories data
 * @param {number} gitHubProfileItemChance - Chance of creating profile item vs repo
 * @returns {THREE.Object3D} - The created collectible object
 */
export function createCollectible(currentLane, profileData, githubRepos, gitHubProfileItemChance) {
  const lane = Math.floor(Math.random() * 3);
  
  // Determine if this should be a GitHub profile collectible
  // Always use profile items if we have them available (force balanced distribution)
  const isProfileItem = profileData.length > 0 && Math.random() < gitHubProfileItemChance;
  
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
        lastDisplayedItemId && 
        (
          // Check the ID first if available
          (selectedItem.id && selectedItem.id === lastDisplayedItemId) ||
          // Fall back to name comparison if no IDs
          (!selectedItem.id && selectedItem.name === lastDisplayedItemId)
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
    
    // Use orange color for resume items, GitHub green for GitHub items
    const itemColor = isResumeItem ? RESUME_COLOR : GITHUB_COLOR; // Orange for resume, green for GitHub
    const innerColor = isResumeItem ? RESUME_DARK_COLOR : GITHUB_DARK_COLOR; // Darker variant
    
    // For profile items, use a special shape - holographic octahedron or diamond
    const pyramidGroup = new THREE.Group();
    
    // Choose geometry based on source
    let pyramidGeometry, innerGeometry;
    if (isResumeItem) {
      // Resume items use diamond shape (octahedron)
      pyramidGeometry = new THREE.OctahedronGeometry(0.35, 0);
      innerGeometry = new THREE.OctahedronGeometry(0.25, 0);
    } else {
      // GitHub items use octahedron shape
      pyramidGeometry = new THREE.OctahedronGeometry(0.35, 0);
      innerGeometry = new THREE.OctahedronGeometry(0.25, 0);
    }
    
    // Create outer wireframe
    const pyramidMaterial = new THREE.MeshBasicMaterial({ 
      color: itemColor,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const pyramidWireframe = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramidGroup.add(pyramidWireframe);
    
    // Create inner solid
    const innerMaterial = new THREE.MeshBasicMaterial({ 
      color: innerColor,
      transparent: true,
      opacity: 0.3
    });
    const innerPyramid = new THREE.Mesh(innerGeometry, innerMaterial);
    pyramidGroup.add(innerPyramid);
    
    // Add symbol on one face - GH for GitHub, CV for resume
    const addSymbol = () => {
      // Create canvas for text
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      
      // Draw text based on source
      context.fillStyle = '#FFFFFF';
      context.font = 'bold 32px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      if (isResumeItem) {
        context.fillText('CV', 64, 64); // CV for resume/curriculum vitae
      } else {
        context.fillText('GH', 64, 64); // GH for GitHub
      }
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create material with texture
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      // Create plane for the face
      const plane = new THREE.PlaneGeometry(0.3, 0.3);
      const textMesh = new THREE.Mesh(plane, material);
      textMesh.position.set(0, 0.1, 0.2);
      textMesh.lookAt(0, 0.5, 1);
      
      return textMesh;
    };
    
    pyramidGroup.add(addSymbol());
    
    // Add strong glow light
    const pyramidLight = new THREE.PointLight(itemColor, 1.5, 3);
    pyramidLight.position.set(0, 0, 0);
    pyramidGroup.add(pyramidLight);
    
    collectible = pyramidGroup;
    
    // Add special animation function for this collectible
    collectible.userData = {
      ...collectibleUserData,
      animate: function(time) {
        // Rotate the wireframe and inner shape differently
        pyramidWireframe.rotation.y += 0.01;
        innerPyramid.rotation.y -= 0.005;
        innerPyramid.rotation.x += 0.003;
      }
    };
    
    // Position the collectible
    collectible.position.x = LANES[lane];
    collectible.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.2; // Floating effect
    collectible.position.z = COLLECTIBLE_Z_POSITION - Math.random() * 5;
    collectible.scale.set(COLLECTIBLE_SCALE, COLLECTIBLE_SCALE, COLLECTIBLE_SCALE);
    
    return collectible;
  }
  
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
      lastDisplayedItemId && 
      (
        // Check the ID first if available
        (selectedRepo.id && selectedRepo.id === lastDisplayedItemId) ||
        // Fall back to name comparison if no IDs
        (!selectedRepo.id && selectedRepo.name === lastDisplayedItemId)
      )
    );
    
    collectibleUserData.dataItem = selectedRepo;
    console.log("Assigned GitHub repo:", collectibleUserData.dataItem.name);
  } else {
    console.log("No GitHub repos available to assign!");
  }
  
  switch (collectibleType) {
    case 0: // Cassette tape
      const cassetteGroup = new THREE.Group();
      
      // Create cassette body
      const tapeBody = new THREE.BoxGeometry(0.6, 0.1, 0.4);
      const tapeMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor,
        emissive: itemColor
      });
      const tape = new THREE.Mesh(tapeBody, tapeMaterial);
      cassetteGroup.add(tape);
      
      // Add cassette label
      const labelGeometry = new THREE.BoxGeometry(0.4, 0.01, 0.25);
      const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.y = 0.06;
      cassetteGroup.add(label);
      
      // Add cassette holes
      const holeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8);
      const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      const hole1 = new THREE.Mesh(holeGeometry, holeMaterial);
      hole1.rotation.z = Math.PI / 2;
      hole1.position.set(-0.15, 0, 0.2);
      cassetteGroup.add(hole1);
      
      const hole2 = new THREE.Mesh(holeGeometry, holeMaterial);
      hole2.rotation.z = Math.PI / 2;
      hole2.position.set(0.15, 0, 0.2);
      cassetteGroup.add(hole2);
      
      // Add neon glow
      const tapeLight = new THREE.PointLight(itemColor, 1, 2);
      tapeLight.position.set(0, 0, 0);
      cassetteGroup.add(tapeLight);
      
      collectible = cassetteGroup;
      break;
      
    case 1: // Retro game controller
      const controllerGroup = new THREE.Group();
      
      // Controller body
      const controllerGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
      const controllerMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor,
        emissive: itemColor
      });
      const controller = new THREE.Mesh(controllerGeometry, controllerMaterial);
      controllerGroup.add(controller);
      
      // D-pad
      const dpadBaseGeometry = new THREE.BoxGeometry(0.18, 0.02, 0.18);
      const dpadBaseMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const dpadBase = new THREE.Mesh(dpadBaseGeometry, dpadBaseMaterial);
      dpadBase.position.set(-0.2, 0.06, 0);
      controllerGroup.add(dpadBase);
      
      // Action buttons
      const buttonGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
      const buttonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      
      const button1 = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button1.rotation.x = Math.PI / 2;
      button1.position.set(0.15, 0.06, -0.05);
      controllerGroup.add(button1);
      
      const button2 = new THREE.Mesh(buttonGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
      button2.rotation.x = Math.PI / 2;
      button2.position.set(0.25, 0.06, -0.05);
      controllerGroup.add(button2);
      
      // Add controller light
      const controllerLight = new THREE.PointLight(itemColor, 1, 2);
      controllerLight.position.set(0, 0.1, 0);
      controllerGroup.add(controllerLight);
      
      collectible = controllerGroup;
      break;
      
    case 2: // Vinyl record
      const recordGroup = new THREE.Group();
      
      // Main record disk
      const recordGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 32);
      const recordMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const record = new THREE.Mesh(recordGeometry, recordMaterial);
      record.rotation.x = Math.PI / 2;
      recordGroup.add(record);
      
      // Add record label in the center
      const labelRadius = 0.1;
      const recordLabelGeometry = new THREE.CylinderGeometry(labelRadius, labelRadius, 0.025, 32);
      const recordLabelMaterial = new THREE.MeshBasicMaterial({ color: itemColor });
      const recordLabel = new THREE.Mesh(recordLabelGeometry, recordLabelMaterial);
      recordLabel.rotation.x = Math.PI / 2;
      recordLabel.position.z = 0.003;
      recordGroup.add(recordLabel);
      
      // Add center hole
      const holeGeometry2 = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16);
      const holeMaterial2 = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const hole = new THREE.Mesh(holeGeometry2, holeMaterial2);
      hole.rotation.x = Math.PI / 2;
      recordGroup.add(hole);
      
      // Add neon reflection/glow
      const recordLight = new THREE.PointLight(itemColor, 1.5, 3);
      recordLight.position.set(0, 0, 0);
      recordGroup.add(recordLight);
      
      collectible = recordGroup;
      break;
      
    case 3: // Holographic pyramid
      const pyramidGroup = new THREE.Group();
      
      // Create outer wireframe
      const pyramidGeometry = new THREE.TetrahedronGeometry(0.4, 0);
      const pyramidMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const pyramidWireframe = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
      pyramidGroup.add(pyramidWireframe);
      
      // Create inner solid with holographic effect
      const innerGeometry = new THREE.TetrahedronGeometry(0.3, 0);
      const innerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
      });
      const innerPyramid = new THREE.Mesh(innerGeometry, innerMaterial);
      pyramidGroup.add(innerPyramid);
      
      // Add strong glow light
      const pyramidLight = new THREE.PointLight(itemColor, 1.5, 3);
      pyramidLight.position.set(0, 0, 0);
      pyramidGroup.add(pyramidLight);
      
      collectible = pyramidGroup;
      
      // Add special animation function for this collectible
      collectible.userData = {
        ...collectibleUserData,
        animate: function(time) {
          // Rotate the wireframe and inner pyramid differently
          pyramidWireframe.rotation.y += 0.01;
          innerPyramid.rotation.y -= 0.005;
          innerPyramid.rotation.x += 0.003;
        }
      };
      break;
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
      
      // If we couldn't find the data from the collectible, use resume data as fallback
      if (!dataItem) {
        // Prioritize resume data for fallback
        const resumeItems = profileData ? profileData.filter(item => item.source === 'resume') : [];
        if (resumeItems && resumeItems.length > 0) {
          // Get a random resume item as fallback
          const randomIndex = Math.floor(Math.random() * resumeItems.length);
          dataItem = resumeItems[randomIndex];
          dataSource = 'profile';
        }
        // Only fall back to GitHub data if no resume data is available
        else if (profileData && profileData.length > 0) {
          const randomIndex = Math.floor(Math.random() * profileData.length);
          dataItem = profileData[randomIndex];
          dataSource = 'profile';
        } 
        else if (gitHubRepos && gitHubRepos.length > 0) {
          const randomIndex = Math.floor(Math.random() * gitHubRepos.length);
          dataItem = gitHubRepos[randomIndex];
          dataSource = 'github';
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
        lastDisplayedItemId = dataItem.id;
      } else if (dataItem.name) {
        // If no ID exists, use the name as a fallback identifier
        lastDisplayedItemId = dataItem.name;
      }
      
      // Log which item we're tracking to avoid repetition
      console.log("Tracking last displayed item:", lastDisplayedItemId);
      
      // Force the popup to display by calling function directly - but only with 3D text effects
      createExplodingRepoText(new THREE.Vector3(x, y, z), dataItem, scene, explodingTexts);
      
      // No longer show emergency DOM display - only use the 3D text effects
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
 * Clear all collectibles from the scene
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function clearCollectibles(scene) {
  for (const collectible of collectibles) {
    scene.remove(collectible);
  }
  collectibles = [];
}