/**
 * Collectibles module for NEON WAVE game
 * This file is a proxy to maintain backward compatibility
 */
import { createCollectible } from './collectibles/collectibleFactory.js';
import { 
    addCollectible, 
    updateCollectibles, 
    checkCollisions, 
    clearCollectibles 
} from './collectibles/collectibleManager.js';
import { createCollectionEffect } from './collectibles/collectibleEffects.js';

// Re-export everything from the new modules
export {
    createCollectible,
    addCollectible,
    updateCollectibles,
    checkCollisions,
    clearCollectibles,
    createCollectionEffect
};