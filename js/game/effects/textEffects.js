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
    // Create unique ID for this popup to prevent conflicts
    const popupId = 'repo-popup-' + Date.now();
    
    // DOM-based solution for UI display
    const gameContainer = document.getElementById('game-container');
    
    // Remove any existing popups to prevent clutter 
    // (keeping max of 2 popups at once for better readability)
    const existingPopups = document.querySelectorAll('.repo-popup');
    if (existingPopups.length >= 2) {
      const oldestPopup = existingPopups[0];
      if (oldestPopup && oldestPopup.parentNode) {
        oldestPopup.parentNode.removeChild(oldestPopup);
      }
    }
    
    if (gameContainer) {
      // Create a temporary div for displaying info
      const infoDiv = document.createElement('div');
      infoDiv.id = popupId;
      infoDiv.className = 'repo-popup';
      infoDiv.style.position = 'fixed';
      infoDiv.style.top = '30%';
      infoDiv.style.left = '50%';
      infoDiv.style.transform = 'translate(-50%, -50%)';
      infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      infoDiv.style.color = '#00ffff';
      infoDiv.style.padding = '20px';
      infoDiv.style.borderRadius = '10px';
      infoDiv.style.border = '2px solid #00ffff';
      infoDiv.style.fontFamily = '"JetBrains Mono", monospace';
      infoDiv.style.zIndex = '9999';
      infoDiv.style.textAlign = 'center';
      infoDiv.style.fontSize = '18px';
      infoDiv.style.maxWidth = '80%';
      infoDiv.style.boxShadow = '0 0 10px #00ffff';
      infoDiv.style.transition = 'all 0.3s ease-out';
      infoDiv.style.textShadow = '0 0 5px currentColor';
      infoDiv.style.opacity = '0';
      infoDiv.style.pointerEvents = 'none';
      
      // Force visibility
      infoDiv.style.display = 'block !important';
      infoDiv.style.visibility = 'visible !important';
      
      // Add custom animation class 
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes glow {
          0% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 15px currentColor; }
          100% { box-shadow: 0 0 5px currentColor; }
        }
        
        .repo-popup {
          display: block !important;
          visibility: visible !important;
        }
      `;
      document.head.appendChild(styleSheet);
      
      infoDiv.style.animation = 'glow 1.5s infinite';
      
      // Determine if this is a GitHub or resume item
      const isResume = item.source === 'resume';
      
      infoDiv.style.color = isResume ? '#ff5700' : '#6cc644';
      infoDiv.style.borderColor = isResume ? '#ff5700' : '#6cc644';
      infoDiv.style.boxShadow = `0 0 10px ${isResume ? '#ff5700' : '#6cc644'}`;
      
      // Add the item name
      const titleElem = document.createElement('h2');
      titleElem.textContent = item.name || 'Unknown';
      titleElem.style.marginBottom = '10px';
      titleElem.style.textShadow = '0 0 8px currentColor';
      titleElem.style.fontSize = '24px';
      titleElem.style.fontWeight = '900';
      infoDiv.appendChild(titleElem);
      
      // Add description if available
      if (item.description) {
        const descElem = document.createElement('div');
        descElem.textContent = item.description;
        descElem.style.marginBottom = '10px';
        descElem.style.textShadow = '0 0 5px currentColor';
        descElem.style.fontSize = '18px';
        infoDiv.appendChild(descElem);
      }
      
      // Add details if available
      if (item.details) {
        const detailsElem = document.createElement('div');
        detailsElem.textContent = item.details;
        detailsElem.style.fontSize = '16px';
        detailsElem.style.opacity = '0.9';
        detailsElem.style.textShadow = '0 0 4px currentColor';
        detailsElem.style.marginTop = '5px';
        infoDiv.appendChild(detailsElem);
      }
      
      // For GitHub repos, add language and stars
      if (item.language || item.stars) {
        const metaElem = document.createElement('div');
        metaElem.style.marginTop = '10px';
        metaElem.style.fontSize = '16px';
        metaElem.style.color = '#ffff00';
        metaElem.style.textShadow = '0 0 6px #ffff00'; 
        
        if (item.language) {
          metaElem.textContent = `[${item.language}]`;
        }
        
        if (item.stars) {
          if (item.language) metaElem.textContent += ' ';
          metaElem.textContent += `★ ${item.stars}`;
        }
        
        infoDiv.appendChild(metaElem);
      }
      
      // Add to document body
      document.body.appendChild(infoDiv);
      
      // Force a browser reflow to ensure the element is rendered
      void infoDiv.offsetWidth;
      
      // Trigger animation by setting a timeout to allow the DOM to update
      setTimeout(() => {
        infoDiv.style.opacity = '1';
        infoDiv.style.transform = 'translate(-50%, -50%)';
      }, 10);
      
      // Begin fade out after 5 seconds, then remove
      setTimeout(() => {
        if (infoDiv) {
          infoDiv.style.opacity = '0';
          infoDiv.style.transform = 'translate(-50%, -40%)';
          
          // Remove after fade completes
          setTimeout(() => {
            if (infoDiv && infoDiv.parentNode) {
              infoDiv.parentNode.removeChild(infoDiv);
            }
          }, 500);
        }
      }, 5000);
      
      // Position newer popups higher than older ones to prevent overlap
      const existingPopups = document.querySelectorAll('.repo-popup');
      const existingCount = existingPopups.length;
      if (existingCount > 0) {
        infoDiv.style.top = (20 + (existingCount * 10)) + '%';
      }
    } else {
      // If game container not found, create it
      const fallbackContainer = document.createElement('div');
      fallbackContainer.id = 'game-container';
      document.body.appendChild(fallbackContainer);
      // Try again with the new container
      createExplodingRepoText(position, item, scene, explodingTexts);
      return;
    }
    
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