/**
 * Fact Collectibles - Creates fact-based collectible objects
 */

// Central collection of facts that can be easily expanded
export const FACTS = [
    "Busted by the FBI for computer hacking in 1993",
    "Grew up in St. Louis",
    "Went to University of Missouri-Rolla",
    "Loves growing Dahlias 🌸",
    "Collects vinyl"
];

/**
 * Create a fact-based collectible
 * @param {number} itemColor - The color for the collectible
 * @returns {THREE.Group} - The created collectible object
 */
export function createFactCollectible(itemColor) {
    const factGroup = new THREE.Group();
    
    // Create a floating text-like object (stylized book or scroll)
    const scrollGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
    const scrollMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor,
        transparent: true,
        opacity: 0.8
    });
    const scroll = new THREE.Mesh(scrollGeometry, scrollMaterial);
    factGroup.add(scroll);
    
    // Add "lines" to represent text on the scroll/book
    const lineGeometry = new THREE.BoxGeometry(0.4, 0.03, 0.01);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const line1 = new THREE.Mesh(lineGeometry, lineMaterial);
    line1.position.y = 0.1;
    line1.position.z = 0.03;
    factGroup.add(line1);
    
    const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line2.position.y = 0.02;
    line2.position.z = 0.03;
    factGroup.add(line2);
    
    const line3 = new THREE.Mesh(lineGeometry, lineMaterial);
    line3.position.y = -0.06;
    line3.position.z = 0.03;
    factGroup.add(line3);
    
    // Add info symbol on top
    const infoGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
    const infoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const infoSymbol = new THREE.Mesh(infoGeometry, infoMaterial);
    infoSymbol.rotation.x = Math.PI / 2;
    infoSymbol.position.set(0, 0.25, 0);
    factGroup.add(infoSymbol);
    
    // Add "i" on the info symbol
    const iGeometry = new THREE.BoxGeometry(0.01, 0.04, 0.01);
    const iMaterial = new THREE.MeshBasicMaterial({ color: itemColor });
    const iSymbol = new THREE.Mesh(iGeometry, iMaterial);
    iSymbol.position.set(0, 0.25, 0.03);
    factGroup.add(iSymbol);
    
    // Add neon glow light
    const factLight = new THREE.PointLight(itemColor, 1, 2);
    factLight.position.set(0, 0, 0);
    factGroup.add(factLight);
    
    // Add special animation function for this collectible
    factGroup.userData = {
        animate: function(time) {
            // Gentle bobbing and rotation
            factGroup.rotation.y += 0.01;
            factGroup.rotation.z = Math.sin(time * 0.002) * 0.1;
        }
    };
    
    return factGroup;
}

/**
 * Get a random fact from the collection
 * @returns {Object} - Fact data object
 */
export function getRandomFact() {
    const randomIndex = Math.floor(Math.random() * FACTS.length);
    return {
        name: "Fact",
        description: FACTS[randomIndex],
        source: "fact",
        type: "fact"
    };
}