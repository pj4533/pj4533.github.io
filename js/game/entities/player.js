/**
 * Player module for NEON WAVE game
 */
import { PLAYER_SIZE, LANES } from '../core/constants.js';

/**
 * Creates a player object (80s style hovering car)
 * @returns {THREE.Group} The player object
 */
export function createPlayer() {
  // Create car body
  const carGroup = new THREE.Group();

  // Main body - neon colored hovercar
  const bodyGeometry = new THREE.BoxGeometry(PLAYER_SIZE + 0.1, PLAYER_SIZE / 2, PLAYER_SIZE + 0.3);
  const bodyMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.5
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  carGroup.add(body);

  // Top part
  const topGeometry = new THREE.BoxGeometry(PLAYER_SIZE - 0.1, PLAYER_SIZE / 3, PLAYER_SIZE - 0.1);
  const topMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x0000ff,
    emissive: 0x0000ff,
    emissiveIntensity: 0.2
  });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.y = 0.25;
  carGroup.add(top);

  // Add lights for the car
  const frontLightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const frontLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

  const leftLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
  leftLight.position.set(-0.2, 0, 0.3);
  carGroup.add(leftLight);

  const rightLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
  rightLight.position.set(0.2, 0, 0.3);
  carGroup.add(rightLight);

  // Add neon glow
  const playerLight = new THREE.PointLight(0x00ffff, 1, 3);
  playerLight.position.set(0, 0.5, 0);
  carGroup.add(playerLight);

  return carGroup;
}

/**
 * Initializes the player object and positions it in the starting lane
 * @param {THREE.Scene} scene - The game scene
 * @param {number} currentLane - The initial lane index (0, 1, or 2)
 * @returns {THREE.Group} The player object
 */
export function initializePlayer(scene, currentLane = 1) {
  const player = createPlayer();
  
  // Position the player
  player.position.y = PLAYER_SIZE / 2;
  player.position.z = 0;
  player.position.x = LANES[currentLane];
  
  scene.add(player);
  return player;
}

/**
 * Handles player movement based on keyboard input
 * @param {KeyboardEvent} event - The keyboard event
 * @param {THREE.Group} player - The player object
 * @param {number} currentLane - The current lane index
 * @returns {number} The new lane index after movement
 */
export function handlePlayerMovement(event, player, currentLane) {
  // Handle movement with arrow keys
  if (event.key === 'ArrowLeft') {
    if (currentLane > 0) {
      currentLane--;
      player.rotation.z = 0.2;
      setTimeout(() => {
        if (player) player.rotation.z = 0;
      }, 200);
    }
  } else if (event.key === 'ArrowRight') {
    if (currentLane < 2) {
      currentLane++;
      player.rotation.z = -0.2;
      setTimeout(() => {
        if (player) player.rotation.z = 0;
      }, 200);
    }
  }
  
  return currentLane;
}

/**
 * Updates player position and animations for each frame
 * @param {THREE.Group} player - The player object
 * @param {number} currentLane - The current lane index
 */
export function updatePlayer(player, currentLane) {
  if (!player) return;
  
  // Move player to target lane with smooth interpolation
  player.position.x += (LANES[currentLane] - player.position.x) * 0.1;
  
  // Animate hover effect
  if (player.children && player.children.length > 0) {
    player.children.forEach(child => {
      try {
        // Add slight bobbing motion to simulate hovering
        child.position.y = Math.sin(Date.now() * 0.005) * 0.03;
      } catch (e) {
        console.error('Error updating player child:', e);
      }
    });
  }
}