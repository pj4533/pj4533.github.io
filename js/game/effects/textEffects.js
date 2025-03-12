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
    
    // Position for the single text display
    const textPosition = position.clone();
    textPosition.y += 0.8; // Slightly raised position
    textPosition.z -= 1; // Bring slightly closer to camera for emphasis
    
    // Determine display color based on source
    let displayColor = isProfileItem ? 
      (item.source === 'resume' ? RESUME_COLOR : GITHUB_COLOR) : 
      0xffff00;
    
    // Create a single combined text display
    let combinedText = '';
    
    // First, add the name with appropriate emoji if it's a profile item
    if (isProfileItem) {
      // Add emoji based on type
      let emoji = '';
      switch(item.type) {
        case 'profile': emoji = '👤'; break;
        case 'location': emoji = '📍'; break;
        case 'stats': emoji = '📊'; break;
        case 'languages': emoji = '💻'; break;
        case 'featured_repo': emoji = '⭐'; break;
        case 'job': emoji = '🏢'; break;
        case 'job_details': emoji = '💼'; break;
        case 'skills': emoji = '🔧'; break;
        case 'education': emoji = '🎓'; break;
        case 'award': emoji = '🏆'; break;
        default: emoji = '';
      }
      // Just show the name, nothing else - no emoji to save space
      combinedText = item.name;
    } else {
      // For GitHub repos, only show the name, nothing else
      combinedText = item.name;
    }
    
    // Add either description or details (not both) to avoid text overflow
    // Instead of truncating with "...", show complete shorter text
    if (item.description && item.description.trim() !== '') {
      // Pick shorter of name or description, and don't truncate it
      const shorterText = (item.name.length < item.description.length) ? 
                        item.name : 
                        item.description;
      combinedText = shorterText;
    }
    
    // Create a single text particle with all the information
    const textParticle = new TextParticle(combinedText, textPosition, displayColor, true);
    
    // Only add to scene if mesh was created successfully
    if (textParticle.mesh) {
      scene.add(textParticle.mesh);
      explodingTexts.push(textParticle);
    }
  } catch (err) {
    console.error('Error creating repo text effect:', err);
  }
}