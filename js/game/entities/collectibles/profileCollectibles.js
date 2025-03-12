/**
 * Profile Collectibles - Creates profile data collectible objects
 */
import { GITHUB_COLOR, GITHUB_DARK_COLOR, RESUME_COLOR, RESUME_DARK_COLOR } from '../../core/constants.js';

/**
 * Create a profile collectible
 * @param {boolean} isResumeItem - Whether this is a resume item or GitHub item
 * @returns {THREE.Group} - The created collectible object
 */
export function createProfileCollectible(isResumeItem) {
    // For profile items, use a special shape - holographic octahedron or diamond
    const pyramidGroup = new THREE.Group();
    
    // Use orange color for resume items, GitHub green for GitHub items
    const itemColor = isResumeItem ? RESUME_COLOR : GITHUB_COLOR; // Orange for resume, green for GitHub
    const innerColor = isResumeItem ? RESUME_DARK_COLOR : GITHUB_DARK_COLOR; // Darker variant
    
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
    pyramidGroup.add(createSymbol(isResumeItem));
    
    // Add strong glow light
    const pyramidLight = new THREE.PointLight(itemColor, 1.5, 3);
    pyramidLight.position.set(0, 0, 0);
    pyramidGroup.add(pyramidLight);
    
    return pyramidGroup;
}

/**
 * Create symbol for profile collectible
 * @param {boolean} isResumeItem - Whether this is a resume item or GitHub item
 * @returns {THREE.Mesh} - The created symbol mesh
 */
function createSymbol(isResumeItem) {
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
}