/**
 * Text effects module for creating exploding text displays
 */
import { TextParticle } from './textParticle.js';
import { GITHUB_COLOR, GITHUB_DARK_COLOR, RESUME_COLOR } from '../core/constants.js';

/**
 * Creates an exploding text effect for repositories and profile data
 * @param {THREE.Vector3} position - Position in 3D space
 * @param {Object} item - The data item to display
 * @param {THREE.Scene} scene - The Three.js scene to add particles to
 * @param {Array} explodingTexts - Array to store the particles
 */
export function createExplodingRepoText(position, item, scene, explodingTexts) {
  try {
    // Skip DOM elements - only use the 3D text effects
    // Check if this is a valid item to display
    if (!item || !item.name) {
      console.log("Skipping invalid item display");
      return;
    }
    
    // Completely skip DOM display elements - only use 3D text effects
    // This removes all the HTML/DOM elements that might be causing issues
    
    if (!item || !position) {
      console.error('Invalid item or position for exploding text');
      return;
    }
    
    // Handle GitHub profile, resume data, and GitHub repo items
    const isProfileItem = item.type && [
      'profile', 'location', 'stats', 'languages', 'featured_repo', 
      'job', 'job_details', 'skills', 'education', 'award'
    ].includes(item.type);
    
    // Move item name to an optimal centered viewing position
    const namePosition = position.clone();
    namePosition.y += 0.8; // Slightly raised position
    namePosition.z -= 1; // Bring slightly closer to camera for emphasis
    
    // For profile items (both GitHub and resume), add special prefix based on type
    let displayName = item.name || 'Unnamed';
    let displayColor = item.color || 0xffff00;
    
    if (isProfileItem) {
      // Add prefix by type
      switch(item.type) {
        // GitHub profile data
        case 'profile':
          displayName = `👤 ${displayName}`;
          break;
        case 'location':
          displayName = `📍 ${displayName}`;
          break;
        case 'stats':
          displayName = `📊 ${displayName}`;
          break;
        case 'languages':
          displayName = `💻 ${displayName}`;
          break;
        case 'featured_repo':
          displayName = `⭐ ${displayName}`;
          break;
          
        // Resume data
        case 'job':
          displayName = `🏢 ${displayName}`;
          break;
        case 'job_details':
          displayName = `💼 ${displayName}`;
          break;
        case 'skills':
          displayName = `🔧 ${displayName}`;
          break;
        case 'education':
          displayName = `🎓 ${displayName}`;
          break;
        case 'award':
          displayName = `🏆 ${displayName}`;
          break;
      }
      
      // Use the item's color (resume items use orange, GitHub items use green)
      displayColor = item.color || GITHUB_COLOR;
    }

    // Ensure name is valid and properly formatted
    const displayNameFormatted = String(displayName).toUpperCase();
    
    // Create particle for name with isNameFlag set to true
    const nameParticle = new TextParticle(displayNameFormatted, namePosition, displayColor, true);
    
    // Only add to scene if mesh was created successfully
    if (nameParticle.mesh) {
      scene.add(nameParticle.mesh);
      explodingTexts.push(nameParticle);
    }
    
    // Always show description if available
    if (item.description && item.description.trim() !== '') {
      setTimeout(() => {
        // Position description below the name with more vertical space
        const descPosition = namePosition.clone();
        descPosition.y -= 1.2; // Increased space between name and description
        
        // Create description text
        const descText = isProfileItem 
          ? item.description
          : `[${item.description}]`;
        
        const descParticle = new TextParticle(descText, descPosition, displayColor, true);
        
        if (descParticle.mesh) {
          scene.add(descParticle.mesh);
          explodingTexts.push(descParticle);
        }
      }, 300); // Longer delay for better reading of the name first
    }
    
    // For GitHub repos, add language and stars information if available
    if (item.language || item.stars) {
      setTimeout(() => {
        let infoText = '';
        // Only add language if it exists and isn't unusual
        if (item.language && item.language.length > 1 && item.language.toLowerCase() !== 'shift') {
          infoText += `[${item.language}]`;
        }
        
        // Add stars if available
        if (item.stars && item.stars > 0) infoText += ` ★ ${item.stars}`;
        
        // Only proceed if we have valid info text
        if (infoText && infoText.trim() !== '') {
          // Position at bottom with more space
          const infoPosition = namePosition.clone();
          infoPosition.y -= item.description ? 2.2 : 1.2; // Increased vertical spacing
          
          // Create info text particle
          const infoParticle = new TextParticle(infoText, infoPosition, 0xffff00, true);
          
          if (infoParticle.mesh) {
            scene.add(infoParticle.mesh);
            explodingTexts.push(infoParticle);
          }
        }
      }, 500); // Delay even more for better readability
    }
    
    // For GitHub profile items, add details information if available
    if (isProfileItem && item.details && item.details.trim() !== '') {
      setTimeout(() => {
        // Position details below description with more consistent spacing
        const detailsPosition = namePosition.clone();
        detailsPosition.y -= item.description ? 2.2 : 1.2; // Match GitHub info spacing
        
        // Format the details text
        let detailsText = item.details;
        
        // If we're dealing with long details text, add more bottom padding
        if (detailsText.length > 60) {
          // Adjust vertical position even more for very long text
          detailsPosition.y -= 0.2;
        }
        
        const detailsParticle = new TextParticle(detailsText, detailsPosition, GITHUB_DARK_COLOR, true); // GitHub darker green
        
        if (detailsParticle.mesh) {
          scene.add(detailsParticle.mesh);
          explodingTexts.push(detailsParticle);
        }
      }, 500); // Match GitHub info timing
    }
  } catch (err) {
    console.error('Error creating repo text effect:', err);
  }
}