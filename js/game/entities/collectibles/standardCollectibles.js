/**
 * Standard Collectibles - Creates standard collectible objects
 */

/**
 * Create a standard collectible of the specified type
 * @param {number} collectibleType - Type of collectible to create (0-3)
 * @param {number} itemColor - The color for the collectible
 * @returns {THREE.Object3D} - The created collectible object
 */
export function createStandardCollectible(collectibleType, itemColor) {
    let collectible;
    
    switch (collectibleType) {
        case 0: // Cassette tape
            collectible = createCassetteTape(itemColor);
            break;
            
        case 1: // Retro game controller
            collectible = createGameController(itemColor);
            break;
            
        case 2: // Crystal/Hex prism
            collectible = createCrystal(itemColor);
            break;
            
        case 3: // Holographic pyramid
            collectible = createHolographicPyramid(itemColor);
            break;
    }
    
    return collectible;
}

/**
 * Create a cassette tape collectible
 * @param {number} itemColor - The color for the collectible
 * @returns {THREE.Group} - The created collectible object
 */
function createCassetteTape(itemColor) {
    const cassetteGroup = new THREE.Group();
    
    // Create cassette body
    const tapeBody = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const tapeMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor
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
    
    return cassetteGroup;
}

/**
 * Create a game controller collectible
 * @param {number} itemColor - The color for the collectible
 * @returns {THREE.Group} - The created collectible object
 */
function createGameController(itemColor) {
    const controllerGroup = new THREE.Group();
    
    // Controller body
    const controllerGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const controllerMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor
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
    
    return controllerGroup;
}

/**
 * Create a crystal collectible
 * @param {number} itemColor - The color for the collectible
 * @returns {THREE.Group} - The created collectible object
 */
function createCrystal(itemColor) {
    const crystalGroup = new THREE.Group();
    
    // Create a hexagonal prism base
    // Use a cylinder with 6 segments to create a hexagonal shape
    const crystalBaseGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.35, 6, 1);
    const crystalBaseMaterial = new THREE.MeshBasicMaterial({
        color: itemColor,
        transparent: true,
        opacity: 0.7,
        wireframe: false
    });
    const crystalBase = new THREE.Mesh(crystalBaseGeometry, crystalBaseMaterial);
    crystalBase.rotation.x = Math.PI / 6; // Tilt slightly for better visibility
    crystalGroup.add(crystalBase);
    
    // Create crystal edges (wireframe)
    const edgesGeometry = new THREE.EdgesGeometry(crystalBaseGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.rotation.x = Math.PI / 6; // Same rotation as base
    crystalGroup.add(edges);
    
    // Add a pyramidal top
    const topGeometry = new THREE.ConeGeometry(0.25, 0.25, 6);
    const topMaterial = new THREE.MeshBasicMaterial({
        color: itemColor,
        transparent: true,
        opacity: 0.7
    });
    const crystalTop = new THREE.Mesh(topGeometry, topMaterial);
    crystalTop.rotation.x = Math.PI / 6; // Same rotation as base
    crystalTop.position.y = 0.3; // Position on top of base
    crystalGroup.add(crystalTop);
    
    // Add top edges
    const topEdgesGeometry = new THREE.EdgesGeometry(topGeometry);
    const topEdges = new THREE.LineSegments(topEdgesGeometry, edgesMaterial);
    topEdges.rotation.x = Math.PI / 6; // Same rotation as top
    topEdges.position.y = 0.3; // Same position as top
    crystalGroup.add(topEdges);
    
    // Add neon glow light
    const crystalLight = new THREE.PointLight(itemColor, 1.5, 3);
    crystalLight.position.set(0, 0, 0);
    crystalGroup.add(crystalLight);
    
    // Add special animation function for this collectible
    crystalGroup.userData = {
        animate: function(time) {
            // Rotate the crystal continuously for sparkle effect
            crystalBase.rotation.y += 0.01;
            edges.rotation.y += 0.01;
            crystalTop.rotation.y += 0.01;
            topEdges.rotation.y += 0.01;
        }
    };
    
    return crystalGroup;
}

/**
 * Create a holographic pyramid collectible
 * @param {number} itemColor - The color for the collectible
 * @returns {THREE.Group} - The created collectible object
 */
function createHolographicPyramid(itemColor) {
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
    
    // Add special animation function for this collectible
    pyramidGroup.userData = {
        animate: function(time) {
            // Rotate the wireframe and inner pyramid differently
            pyramidWireframe.rotation.y += 0.01;
            innerPyramid.rotation.y -= 0.005;
            innerPyramid.rotation.x += 0.003;
        }
    };
    
    return pyramidGroup;
}