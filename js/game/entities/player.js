/**
 * Player module for NEON WAVE game
 */
import { PLAYER_SIZE, LANES } from '../core/constants.js';

/**
 * Creates a player object (80s style hovering hot rod with synthwave aesthetics)
 * @returns {THREE.Group} The player object
 */
export function createPlayer() {
  // Create car body group
  const carGroup = new THREE.Group();
  
  // Base color and material settings
  const mainColor = 0x00ffff;
  const accentColor = 0xff00ff;
  const metalColor = 0x333333;
  const glassColor = 0x66ffff;
  
  // Main body - sleek and low profile
  const bodyGeometry = new THREE.BoxGeometry(PLAYER_SIZE + 0.2, PLAYER_SIZE / 3, PLAYER_SIZE + 0.5);
  const bodyMaterial = new THREE.MeshLambertMaterial({ 
    color: mainColor,
    emissive: mainColor,
    emissiveIntensity: 0.6
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.05;
  carGroup.add(body);
  
  // Front hood - sloped downward for aerodynamic look
  const hoodGeometry = new THREE.BoxGeometry(PLAYER_SIZE, PLAYER_SIZE / 4, PLAYER_SIZE / 2);
  const hoodMaterial = new THREE.MeshLambertMaterial({
    color: mainColor,
    emissive: mainColor,
    emissiveIntensity: 0.5
  });
  const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
  hood.position.set(0, 0.1, 0.35);
  hood.rotation.x = -0.2;
  carGroup.add(hood);
  
  // Rear spoiler - tall and dramatic
  const spoilerStandGeometry = new THREE.BoxGeometry(PLAYER_SIZE - 0.2, PLAYER_SIZE / 4, 0.05);
  const spoilerMaterial = new THREE.MeshLambertMaterial({ 
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.7
  });
  
  const spoilerStandLeft = new THREE.Mesh(spoilerStandGeometry, spoilerMaterial);
  spoilerStandLeft.position.set(-0.2, 0.15, -0.3);
  carGroup.add(spoilerStandLeft);
  
  const spoilerStandRight = new THREE.Mesh(spoilerStandGeometry, spoilerMaterial);
  spoilerStandRight.position.set(0.2, 0.15, -0.3);
  carGroup.add(spoilerStandRight);
  
  const spoilerTopGeometry = new THREE.BoxGeometry(PLAYER_SIZE + 0.3, 0.05, 0.15);
  const spoilerTop = new THREE.Mesh(spoilerTopGeometry, spoilerMaterial);
  spoilerTop.position.set(0, 0.3, -0.3);
  carGroup.add(spoilerTop);
  
  // Cockpit/cabin with tinted glass
  const cabinGeometry = new THREE.BoxGeometry(PLAYER_SIZE - 0.2, PLAYER_SIZE / 4, PLAYER_SIZE);
  const cabinMaterial = new THREE.MeshLambertMaterial({
    color: glassColor,
    emissive: glassColor,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.y = 0.22;
  carGroup.add(cabin);
  
  // Exhaust pipes
  const exhaustGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
  const exhaustMaterial = new THREE.MeshLambertMaterial({
    color: metalColor,
    emissive: 0xff3300,
    emissiveIntensity: 0.3
  });
  
  const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  leftExhaust.rotation.x = Math.PI / 2;
  leftExhaust.position.set(-0.25, 0.05, -0.4);
  carGroup.add(leftExhaust);
  
  const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  rightExhaust.rotation.x = Math.PI / 2;
  rightExhaust.position.set(0.25, 0.05, -0.4);
  carGroup.add(rightExhaust);
  
  // Front headlights (brighter and larger)
  const headlightGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.05);
  const headlightMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    emissive: 0xffffcc,
    emissiveIntensity: 1
  });
  
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.25, 0.08, 0.45);
  carGroup.add(leftHeadlight);
  
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.25, 0.08, 0.45);
  carGroup.add(rightHeadlight);
  
  // Tail lights - rectangular with glow
  const taillightGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.02);
  const taillightMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 1
  });
  
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.25, 0.1, -0.4);
  carGroup.add(leftTaillight);
  
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.25, 0.1, -0.4);
  carGroup.add(rightTaillight);
  
  // Wheels - hover plates with glow
  const wheelGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.3);
  const wheelMaterial = new THREE.MeshLambertMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.8
  });
  
  const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontLeftWheel.position.set(-0.35, -0.1, 0.25);
  carGroup.add(frontLeftWheel);
  
  const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontRightWheel.position.set(0.35, -0.1, 0.25);
  carGroup.add(frontRightWheel);
  
  const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearLeftWheel.position.set(-0.35, -0.1, -0.25);
  carGroup.add(rearLeftWheel);
  
  const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearRightWheel.position.set(0.35, -0.1, -0.25);
  carGroup.add(rearRightWheel);
  
  // Hover effect - glowing plates under wheels
  const hoverGeometry = new THREE.PlaneGeometry(0.2, 0.4);
  const hoverMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    emissive: mainColor,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  
  const frontLeftHover = new THREE.Mesh(hoverGeometry, hoverMaterial);
  frontLeftHover.rotation.x = Math.PI / 2;
  frontLeftHover.position.set(-0.35, -0.15, 0.25);
  carGroup.add(frontLeftHover);
  
  const frontRightHover = new THREE.Mesh(hoverGeometry, hoverMaterial);
  frontRightHover.rotation.x = Math.PI / 2;
  frontRightHover.position.set(0.35, -0.15, 0.25);
  carGroup.add(frontRightHover);
  
  const rearLeftHover = new THREE.Mesh(hoverGeometry, hoverMaterial);
  rearLeftHover.rotation.x = Math.PI / 2;
  rearLeftHover.position.set(-0.35, -0.15, -0.25);
  carGroup.add(rearLeftHover);
  
  const rearRightHover = new THREE.Mesh(hoverGeometry, hoverMaterial);
  rearRightHover.rotation.x = Math.PI / 2;
  rearRightHover.position.set(0.35, -0.15, -0.25);
  carGroup.add(rearRightHover);
  
  // Add neon glow lights
  const mainGlow = new THREE.PointLight(mainColor, 1, 3);
  mainGlow.position.set(0, 0.5, 0);
  carGroup.add(mainGlow);
  
  const frontGlow = new THREE.PointLight(0xffffff, 0.7, 2);
  frontGlow.position.set(0, 0, 0.7);
  carGroup.add(frontGlow);
  
  const rearGlow = new THREE.PointLight(0xff0000, 0.5, 1);
  rearGlow.position.set(0, 0.1, -0.5);
  carGroup.add(rearGlow);

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
  
  // Get current time for animations
  const now = Date.now();
  
  // Animate hover effect
  if (player.children && player.children.length > 0) {
    player.children.forEach((child, index) => {
      try {
        // Only animate specific elements, not the whole car
        if (child.geometry) {
          if (child.geometry instanceof THREE.PlaneGeometry) {
            // Hover plates - animate glow intensity only
            if (child.material && child.material.opacity !== undefined) {
              child.material.opacity = 0.4 + Math.sin(now * 0.01) * 0.2;
            }
            // Don't move the hover plates up and down
          } else if (child.geometry instanceof THREE.CylinderGeometry) {
            // Exhaust pipes - animate glow effect only
            if (child.material) {
              child.material.emissiveIntensity = 0.3 + Math.random() * 0.4;
            }
          }
          // No position changes for car body parts
        } else if (child instanceof THREE.PointLight) {
          // Animate lights intensity only, not position
          if (child.color.getHex() === 0xff0000) {
            // Rear light - pulse
            child.intensity = 0.5 + Math.sin(now * 0.01) * 0.2;
          } else if (child.color.getHex() === 0xffffff) {
            // Front light - steady
            child.intensity = 0.7;
          } else {
            // Main cyan glow - pulse
            child.intensity = 1 + Math.sin(now * 0.006) * 0.3;
          }
        }
        // No default hover animation to prevent bouncing
      } catch (e) {
        console.error('Error updating player child:', e);
      }
    });
  }
}