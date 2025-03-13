/**
 * Scene Manager for NEON WAVE game
 * Handles scene, camera, renderer and environment initialization
 */
import {
    // Scene settings
    SCENE_BACKGROUND_COLOR, FOG_COLOR, FOG_NEAR, FOG_FAR,
    
    // Camera settings
    CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR, CAMERA_POSITION, CAMERA_LOOK_AT,
    
    // Lighting
    AMBIENT_LIGHT_COLOR, 
    BLUE_LIGHT_COLOR, BLUE_LIGHT_INTENSITY, BLUE_LIGHT_DISTANCE, BLUE_LIGHT_POSITION,
    PINK_LIGHT_COLOR, PINK_LIGHT_INTENSITY, PINK_LIGHT_DISTANCE, PINK_LIGHT_POSITION,
    
    // Grid settings
    PRIMARY_GRID_SIZE, PRIMARY_GRID_DIVISIONS, PRIMARY_GRID_COLOR1, PRIMARY_GRID_COLOR2, PRIMARY_GRID_POSITION,
    SECONDARY_GRID_SIZE, SECONDARY_GRID_DIVISIONS, SECONDARY_GRID_POSITION, SECONDARY_GRID_OPACITY,
    FAR_GRID_SIZE, FAR_GRID_DIVISIONS, FAR_GRID_POSITION, FAR_GRID_OPACITY,
    
    // Sun settings
    SUN_RADIUS, SUN_SEGMENTS, SUN_COLOR, SUN_POSITION, SUN_ROTATION_SPEED,
    
    // Track settings
    TRACK_WIDTH, TRACK_LENGTH, TRACK_COLOR, TRACK_POSITION,
    
    // Barrier settings
    BARRIER_WIDTH, BARRIER_HEIGHT, BARRIER_LENGTH, 
    LEFT_BARRIER_COLOR, RIGHT_BARRIER_COLOR,
    LEFT_BARRIER_POSITION, RIGHT_BARRIER_POSITION,
    
    // Lane settings
    LANES,
    
    // Animation timing
    GRID_FLASH_INTERVAL, GRID_FLASH_COUNT,
    
    // Road objects settings
    ROAD_OBJECT_COUNT, ROAD_OBJECT_Z_SPACING, ROAD_OBJECT_X_OFFSET, ROAD_OBJECT_TYPES, NEON_COLORS, ROAD_OBJECT_SCALE
} from './constants.js';

/**
 * Class to manage the scene, camera, renderer and environment objects
 */
export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gridHelper = null;
        this.sun = null;
        this.stars = [];
        this.sunGeometry = null;
        this.roadObjects = []; // Store references to roadside objects
        this.roadLines = []; // Store references to road grid lines
        
        // Pre-created geometries for performance
        this.sharedGeometries = {};
    }
    
    /**
     * Pre-create and store commonly used geometries to avoid runtime generation
     * This is a significant performance optimization for WebGL
     */
    initSharedGeometries() {
        // Palm tree geometries
        this.sharedGeometries.palmTrunk = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
        this.sharedGeometries.frond = new THREE.PlaneGeometry(4, 1); // Simple plane instead of extruded geometry
        
        // Tree geometries
        this.sharedGeometries.treeTrunk = new THREE.CylinderGeometry(0.3, 0.6, 4, 8);
        this.sharedGeometries.leaves1 = new THREE.ConeGeometry(2.5, 3, 8);
        this.sharedGeometries.leaves2 = new THREE.ConeGeometry(2, 2.5, 8);
        this.sharedGeometries.leaves3 = new THREE.ConeGeometry(1.5, 2, 8);
        
        // Cube geometries
        this.sharedGeometries.cube = new THREE.BoxGeometry(2, 4, 2);
        this.sharedGeometries.innerCube = new THREE.BoxGeometry(1.6, 3.6, 1.6);
        
        // Glow sphere geometries in different sizes
        this.sharedGeometries.glowSphere1 = new THREE.SphereGeometry(0.5, 8, 8);
        this.sharedGeometries.glowSphere2 = new THREE.SphereGeometry(0.4, 8, 8);
        this.sharedGeometries.glowSphere3 = new THREE.SphereGeometry(0.3, 8, 8);
        
        console.log("Shared geometries initialized for performance optimization");
    }

    /**
     * Initialize the 3D scene with only essential components for faster startup
     * @returns {SceneManager} This instance for chaining
     */
    initMinimal() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        
        // Initialize shared geometries first - critical for performance
        this.initSharedGeometries();
        
        // Create minimal scene setup
        this.createLights();
        this.createTrack();
        
        // Pre-compile shaders for the scene to prevent stuttering
        this.precompileShaders();
        
        // Handle window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
        return this;
    }
    
    /**
     * Pre-compile shaders to prevent runtime stalls
     * This forces WebGL to compile shaders upfront rather than on-demand
     */
    precompileShaders() {
        if (!this.renderer || !this.scene || !this.camera) return;
        
        console.log("Pre-compiling shaders to prevent runtime stalls");
        
        // Create tiny instances of all material types that will be used
        const precompileMaterials = [
            new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
            new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, transparent: true }),
            new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 })
        ];
        
        // Create a temporary object with these materials
        const tempGeometries = [
            new THREE.SphereGeometry(1, 8, 8),
            this.sharedGeometries.palmTrunk,
            this.sharedGeometries.frond,
            this.sharedGeometries.cube
        ];
        
        // Create temporary objects for each geometry/material combination
        const tempObjects = [];
        for (const geom of tempGeometries) {
            for (const mat of precompileMaterials) {
                const tempObj = new THREE.Mesh(geom, mat);
                tempObj.visible = false;
                this.scene.add(tempObj);
                tempObjects.push(tempObj);
            }
        }
        
        // Force a render pass to compile shaders
        this.renderer.compile(this.scene, this.camera);
        
        // Remove all temporary objects
        for (const obj of tempObjects) {
            this.scene.remove(obj);
        }
    }

    /**
     * Initialize the remaining assets after the minimal scene is running
     * This splits the heavy object creation into a separate step to avoid pauses
     * @returns {SceneManager} This instance for chaining
     */
    initRemainingAssets() {
        // Load these elements in a staggered way
        setTimeout(() => this.createStarfield(), 100);
        setTimeout(() => this.createRetroCyberpunkSun(), 300);
        
        // Create road objects in batches to prevent UI freezes
        this.createRoadObjectsInBatches();
        
        return this;
    }

    /**
     * Initialize the 3D scene with all components (original method for backwards compatibility)
     * @returns {SceneManager} This instance for chaining
     */
    init() {
        this.initMinimal();
        
        // Immediately load all assets (not recommended for performance, use initRemainingAssets instead)
        this.createStarfield();
        this.createRetroCyberpunkSun();
        this.createRoadObjects();
        
        return this;
    }

    /**
     * Create the Three.js scene
     * @returns {THREE.Scene} The created scene
     */
    createScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
        
        // Add fog for depth effect
        this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
        
        return this.scene;
    }

    /**
     * Create and position the camera
     * @returns {THREE.PerspectiveCamera} The created camera
     */
    createCamera() {
        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_FOV, 
            window.innerWidth / window.innerHeight, 
            CAMERA_NEAR, 
            CAMERA_FAR
        );
        
        // Position and orient camera
        this.camera.position.set(
            CAMERA_POSITION.x, 
            CAMERA_POSITION.y, 
            CAMERA_POSITION.z
        );
        this.camera.lookAt(
            CAMERA_LOOK_AT.x, 
            CAMERA_LOOK_AT.y, 
            CAMERA_LOOK_AT.z
        );
        
        // Make camera available globally for other modules
        window.camera = this.camera;
        
        return this.camera;
    }

    /**
     * Create the WebGL renderer
     * @returns {THREE.WebGLRenderer} The created renderer
     */
    createRenderer() {
        try {
            // First clear the game-canvas element to ensure clean state
            const gameCanvas = document.getElementById('game-canvas');
            if (gameCanvas) {
                // Clear any previous content
                gameCanvas.innerHTML = '';
                
                // Create the renderer with explicit pixel ratio
                this.renderer = new THREE.WebGLRenderer({ 
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance'
                });
                
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                
                // Add the canvas element to the DOM
                gameCanvas.appendChild(this.renderer.domElement);
                
                // Force display style to ensure visibility
                this.renderer.domElement.style.display = 'block';
                this.renderer.domElement.style.width = '100%';
                this.renderer.domElement.style.height = '100%';
                
                console.log('WebGL renderer created and attached successfully');
            } else {
                console.error('Game canvas element not found!');
            }
        } catch (e) {
            console.error('Error creating WebGL renderer:', e);
        }
        
        return this.renderer;
    }

    /**
     * Add lighting to the scene
     * Optimized to use fewer lights for better performance
     */
    createLights() {
        // Use a stronger ambient light to reduce need for point lights
        const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, 1.5);
        this.scene.add(ambientLight);
        
        // Use a directional light instead of point lights
        // Directional lights are much less expensive to render
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(0, 10, -10);
        this.scene.add(mainLight);
        
        // Add one primary colored light instead of multiple
        // Reduced shadow calculations and light rendering
        const accentLight = new THREE.PointLight(
            BLUE_LIGHT_COLOR, 
            BLUE_LIGHT_INTENSITY * 0.7, // Reduced intensity
            BLUE_LIGHT_DISTANCE * 2  // Increased distance to cover more area with one light
        );
        accentLight.position.set(
            0,
            15, 
            -10
        );
        
        // Optimize by explicitly disabling shadows (not needed for this style)
        accentLight.castShadow = false;
        this.scene.add(accentLight);
    }

    /**
     * Create starfield backdrop with reduced star count for better performance
     * @returns {THREE.Points} The created starfield
     */
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
        });
        
        const starVertices = [];
        // Create stars with random positions - reduced count for better performance
        // 400 stars still looks good but requires less computation
        const starCount = 400;
        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = -Math.random() * 100;
            starVertices.push(x, y, z);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
        
        return this.stars;
    }

    /**
     * Create a retro cyberpunk sun
     * @returns {THREE.Mesh} The created sun object
     */
    createRetroCyberpunkSun() {
        // Create the sun circle with reduced segment count for better performance
        const segmentCount = Math.min(SUN_SEGMENTS, 24); // Cap segments for better performance
        this.sunGeometry = new THREE.CircleGeometry(SUN_RADIUS, segmentCount);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: SUN_COLOR,
            side: THREE.DoubleSide,
            wireframe: true,
        });
        
        this.sun = new THREE.Mesh(this.sunGeometry, sunMaterial);
        this.sun.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
        this.scene.add(this.sun);
        
        // Reduce number of concentric circles for better performance (3 instead of 5)
        // Group them for easier management
        const sunEffectGroup = new THREE.Group();
        for (let i = 1; i < 4; i++) {
            // Use fewer segments in the ring geometry for better performance
            const ringGeometry = new THREE.RingGeometry(i * 2, i * 2 + 0.1, 16);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? BLUE_LIGHT_COLOR : PINK_LIGHT_COLOR,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            sunEffectGroup.add(ring);
        }
        
        // Position the entire group together
        sunEffectGroup.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
        this.scene.add(sunEffectGroup);
        
        return this.sun;
    }

    /**
     * Create the game track, grid, lane markers, and barriers
     */
    createTrack() {
        // Main track is dark with grid lines
        const trackGeometry = new THREE.PlaneGeometry(TRACK_WIDTH, TRACK_LENGTH);
        const trackMaterial = new THREE.MeshBasicMaterial({ 
            color: TRACK_COLOR,
            wireframe: false
        });
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.rotation.x = -Math.PI / 2;
        track.position.set(TRACK_POSITION.x, TRACK_POSITION.y, TRACK_POSITION.z);
        this.scene.add(track);
        
        // Add road grid lines for more synthwave aesthetic
        this.roadLines = [];
        for (let i = 0; i < 20; i++) {
            // Create horizontal grid lines that run parallel to the track
            const lineGeometry = new THREE.PlaneGeometry(TRACK_WIDTH, 0.05);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? PRIMARY_GRID_COLOR1 : PRIMARY_GRID_COLOR2,
                transparent: true,
                opacity: 0.3
            });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.01, -50 - (i * 25)); // Position each line with spacing
            this.scene.add(line);
            this.roadLines.push(line); // Store reference for animation
        }
        
        // Add 80s-style neon grid lines
        
        // Primary grid - positioned closest to be immediately visible
        this.gridHelper = new THREE.GridHelper(
            PRIMARY_GRID_SIZE, 
            PRIMARY_GRID_DIVISIONS, 
            PRIMARY_GRID_COLOR1, 
            PRIMARY_GRID_COLOR2
        );
        this.gridHelper.position.set(
            PRIMARY_GRID_POSITION.x, 
            PRIMARY_GRID_POSITION.y, 
            PRIMARY_GRID_POSITION.z
        );
        
        // Make grid lines thicker for better visibility
        if (this.gridHelper.material) {
            this.gridHelper.material.linewidth = 2; // May not work in all browsers but worth trying
        }
        this.scene.add(this.gridHelper);
        
        // Secondary grid - positioned further back
        const secondaryGrid = new THREE.GridHelper(
            SECONDARY_GRID_SIZE, 
            SECONDARY_GRID_DIVISIONS, 
            PRIMARY_GRID_COLOR1, 
            PRIMARY_GRID_COLOR2
        );
        secondaryGrid.position.set(
            SECONDARY_GRID_POSITION.x, 
            SECONDARY_GRID_POSITION.y, 
            SECONDARY_GRID_POSITION.z
        );
        secondaryGrid.material.opacity = SECONDARY_GRID_OPACITY;
        secondaryGrid.material.transparent = true;
        this.scene.add(secondaryGrid);
        
        // Far grid - positioned furthest back for depth effect
        const farGrid = new THREE.GridHelper(
            FAR_GRID_SIZE, 
            FAR_GRID_DIVISIONS, 
            PRIMARY_GRID_COLOR1, 
            PRIMARY_GRID_COLOR2
        );
        farGrid.position.set(
            FAR_GRID_POSITION.x, 
            FAR_GRID_POSITION.y, 
            FAR_GRID_POSITION.z
        );
        farGrid.material.opacity = FAR_GRID_OPACITY;
        farGrid.material.transparent = true;
        this.scene.add(farGrid);
        
        // Add lane markers
        for (let lane of LANES) {
            const markerGeometry = new THREE.PlaneGeometry(0.1, TRACK_LENGTH);
            const markerMaterial = new THREE.MeshBasicMaterial({
                color: PRIMARY_GRID_COLOR2,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.x = lane;
            marker.position.y = 0.01;
            marker.position.z = TRACK_POSITION.z;
            marker.rotation.x = -Math.PI / 2;
            this.scene.add(marker);
        }
        
        // Add side barriers with neon effect
        const leftBarrierGeometry = new THREE.BoxGeometry(
            BARRIER_WIDTH, 
            BARRIER_HEIGHT, 
            BARRIER_LENGTH
        );
        const rightBarrierGeometry = new THREE.BoxGeometry(
            BARRIER_WIDTH, 
            BARRIER_HEIGHT, 
            BARRIER_LENGTH
        );
        
        const leftBarrierMaterial = new THREE.MeshBasicMaterial({ color: LEFT_BARRIER_COLOR });
        const rightBarrierMaterial = new THREE.MeshBasicMaterial({ color: RIGHT_BARRIER_COLOR });
        
        const leftBarrier = new THREE.Mesh(leftBarrierGeometry, leftBarrierMaterial);
        const rightBarrier = new THREE.Mesh(rightBarrierGeometry, rightBarrierMaterial);
        
        leftBarrier.position.set(
            LEFT_BARRIER_POSITION.x,
            LEFT_BARRIER_POSITION.y,
            LEFT_BARRIER_POSITION.z
        );
        
        rightBarrier.position.set(
            RIGHT_BARRIER_POSITION.x,
            RIGHT_BARRIER_POSITION.y,
            RIGHT_BARRIER_POSITION.z
        );
        
        this.scene.add(leftBarrier);
        this.scene.add(rightBarrier);
    }

    // Store cached grids to avoid expensive traversal on each flash
    cachedGrids = null;
    
    /**
     * Flash the grid for visual effect
     */
    flashGrid() {
        const originalColors = [PRIMARY_GRID_COLOR1, PRIMARY_GRID_COLOR2];
        let flashCount = 0;
        
        // Find all grid helpers in the scene - use cached version if available
        if (!this.cachedGrids) {
            this.cachedGrids = [];
            // Only do the expensive traversal once and cache the result
            this.scene.traverse(child => {
                if (child instanceof THREE.GridHelper) {
                    this.cachedGrids.push(child);
                }
            });
        }
        
        // Use a more efficient flashing approach
        const allGrids = this.cachedGrids;
        
        // Reduce flash count for better performance during startup
        const reducedFlashCount = 4; // Cut in half from original 8
        
        const flashInterval = setInterval(() => {
            if (flashCount < reducedFlashCount) {
                if (flashCount % 2 === 0) {
                    // Flash to bright white - only update main grid for better performance
                    allGrids.forEach(grid => {
                        if (grid.material && grid.material.length >= 2) {
                            grid.material[0].color.setHex(0xffffff);
                            grid.material[1].color.setHex(0xffffff);
                            // Increase line brightness temporarily
                            grid.material[0].opacity = 1;
                            grid.material[1].opacity = 1;
                        }
                    });
                } else {
                    // Flash back to original colors
                    allGrids.forEach((grid) => {
                        if (grid.material && grid.material.length >= 2) {
                            grid.material[0].color.setHex(originalColors[0]);
                            grid.material[1].color.setHex(originalColors[1]);
                            // Reset opacity for secondary grids
                            if (grid !== this.gridHelper) {
                                grid.material[0].opacity = 0.4;
                                grid.material[1].opacity = 0.4;
                            }
                        }
                    });
                }
                flashCount++;
            } else {
                clearInterval(flashInterval);
            }
        }, GRID_FLASH_INTERVAL * 1.5); // Slightly longer interval between flashes
    }

    /**
     * Handle window resize event
     */
    onWindowResize() {
        if (this.camera && this.renderer) {
            // Update camera aspect ratio
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            
            // Resize renderer
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    /**
     * Render the scene
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            try {
                // Force visibility of the renderer DOM element
                if (this.renderer.domElement) {
                    this.renderer.domElement.style.display = 'block';
                    this.renderer.domElement.style.width = '100%';
                    this.renderer.domElement.style.height = '100%';
                }
                
                // Make sure the camera aspect ratio is correct
                if (this.camera.aspect !== window.innerWidth / window.innerHeight) {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                }
                
                // Render the scene
                this.renderer.render(this.scene, this.camera);
                
            } catch (e) {
                console.error('Error during rendering:', e);
            }
        } else {
            console.error('Cannot render: missing renderer, scene or camera', {
                renderer: !!this.renderer, 
                scene: !!this.scene, 
                camera: !!this.camera
            });
        }
    }
    
    /**
     * Create road objects in smaller batches to prevent frame drops
     * @returns {SceneManager} This instance for chaining
     */
    createRoadObjectsInBatches() {
        const BATCH_SIZE = 5; // Create 5 objects at a time
        let batchCount = 0;
        const totalBatches = Math.ceil(ROAD_OBJECT_COUNT * 2 / BATCH_SIZE); // Both sides
        
        // Function to create one batch of objects
        const createBatch = () => {
            if (batchCount >= totalBatches) return; // Done creating batches
            
            // Calculate which objects to create in this batch
            const startIdx = (batchCount * BATCH_SIZE) % ROAD_OBJECT_COUNT;
            const side = batchCount * BATCH_SIZE >= ROAD_OBJECT_COUNT ? 1 : -1; // Left first, then right
            const batchLimit = Math.min(BATCH_SIZE, ROAD_OBJECT_COUNT - startIdx);
            
            // Create a batch of objects
            for (let i = 0; i < batchLimit; i++) {
                const idx = startIdx + i;
                this.createSingleRoadObject(side, idx);
            }
            
            batchCount++;
            
            // Schedule next batch with a small delay to prevent frame drops
            setTimeout(createBatch, 50);
        };
        
        // Start creating batches
        createBatch();
        return this;
    }
    
    /**
     * Create synthwave-style trees and objects on the sides of the track
     */
    createRoadObjects() {
        // Create objects for both sides of the road
        for (let side = -1; side <= 1; side += 2) { // -1 for left, 1 for right
            for (let i = 0; i < ROAD_OBJECT_COUNT; i++) {
                this.createSingleRoadObject(side, i);
            }
        }
    }
    
    /**
     * Create a single road object (implementation)
     * @param {number} side - Which side of the road (-1 for left, 1 for right)
     * @param {number} i - Index of the object for positioning
     */
    createSingleRoadObject(side, i) {
        // Determine position
        const z = -(i * ROAD_OBJECT_Z_SPACING) - 20; // Start a bit ahead of camera
        
        // Add random variation to x position but ensure it's FAR outside the track
        // Track width is 10 (5 on each side) and barriers are at ±5.1
        // Use negative side values to position objects away from the track
        const xVariation = 5 + (Math.random() * 10); // 5-15 units of additional distance
        const x = side * (ROAD_OBJECT_X_OFFSET + xVariation); // Left or right side with variation
        
        // Randomly pick an object type with 60% chance for palm trees (very synthwave)
        const objectTypeRoll = Math.random();
        let objectType;
        
        if (objectTypeRoll < 0.6) {
            // More palm trees - they're the most synthwave!
            objectType = 'palmTree';
        } else if (objectTypeRoll < 0.8) {
            // Some regular trees
            objectType = 'tree';
        } else {
            // Some cubes
            objectType = 'cube';
        }
        
        // Randomly pick a color with more intense neon glow
        const color = side === -1 ? PINK_LIGHT_COLOR : BLUE_LIGHT_COLOR;
        
        let object;
        
        switch (objectType) {
            case 'palmTree':
                // Create a synthwave palm tree using shared geometry for performance
                const palmTrunkMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x222222,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9
                });
                // Use pre-created geometry for significant performance improvement
                const palmTrunk = new THREE.Mesh(this.sharedGeometries.palmTrunk, palmTrunkMaterial);
                palmTrunk.position.y = 2.5;
                
                // Create palm tree top with multiple palm fronds
                const palmTop = new THREE.Group();
                palmTop.position.y = 5;
                
                // Create multiple palm fronds using simple planes instead of extruded geometry
                for (let f = 0; f < 7; f++) {
                    const angle = (f / 7) * Math.PI * 2;
                    const bendAngle = Math.PI * 0.25; // How much the frond bends downward
                    
                    // Use emissive material to simulate glow without expensive lighting
                    const frondMaterial = new THREE.MeshBasicMaterial({
                        color: color,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.9,
                        emissive: color,
                        emissiveIntensity: 0.5
                    });
                    
                    // Use shared plane geometry rather than expensive extrusion
                    const frond = new THREE.Mesh(this.sharedGeometries.frond, frondMaterial);
                    frond.scale.set(0.8, 0.8, 0.8);
                    
                    // Position and rotate the frond
                    frond.rotation.z = angle;
                    frond.rotation.y = bendAngle;
                    palmTop.add(frond);
                }
                
                // Group trunk and palm top
                object = new THREE.Group();
                object.add(palmTrunk);
                object.add(palmTop);
                
                // Use a bright emissive material for the "glow" sphere instead of expensive point lights
                // This creates a similar visual effect with much better performance
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.6,
                    emissive: color,
                    emissiveIntensity: 1.0
                });
                
                // Add a small glowing sphere for visual effect (not a light source)
                const palmGlowSphere = new THREE.Mesh(
                    this.sharedGeometries.glowSphere1,
                    glowMaterial
                );
                palmGlowSphere.position.y = 5;
                object.add(palmGlowSphere);
                
                // Scale the palm tree
                object.scale.set(ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE);
                
                // Add random rotation for variety
                object.rotation.y = Math.random() * Math.PI * 2;
                break;
                
            case 'tree':
                // Create a synthwave pine tree using shared geometries
                const trunkMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x333333,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9
                });
                // Use pre-created geometry
                const trunk = new THREE.Mesh(this.sharedGeometries.treeTrunk, trunkMaterial);
                
                // Create leaves as three stacked cones - using shared geometries
                // Use emissive material for all leaves to simulate glow without lighting
                const leaves1Material = new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9,
                    emissive: color,
                    emissiveIntensity: 0.3
                });
                const leaves1 = new THREE.Mesh(this.sharedGeometries.leaves1, leaves1Material);
                leaves1.position.y = 3;
                
                const leaves2Material = new THREE.MeshBasicMaterial({
                    color: color === PINK_LIGHT_COLOR ? 0xff00cc : 0x00ccff,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9,
                    emissive: color === PINK_LIGHT_COLOR ? 0xff00cc : 0x00ccff,
                    emissiveIntensity: 0.3
                });
                const leaves2 = new THREE.Mesh(this.sharedGeometries.leaves2, leaves2Material);
                leaves2.position.y = 5;
                
                const leaves3Material = new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9,
                    emissive: color,
                    emissiveIntensity: 0.3
                });
                const leaves3 = new THREE.Mesh(this.sharedGeometries.leaves3, leaves3Material);
                leaves3.position.y = 7;
                
                // Group trunk and leaves
                object = new THREE.Group();
                object.add(trunk);
                object.add(leaves1);
                object.add(leaves2);
                object.add(leaves3);
                
                // Use a glowing sphere instead of expensive point light
                const treeGlowMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.5,
                    emissive: color,
                    emissiveIntensity: 0.8
                });
                
                const treeGlowSphere = new THREE.Mesh(
                    this.sharedGeometries.glowSphere2,
                    treeGlowMaterial
                );
                treeGlowSphere.position.y = 5;
                object.add(treeGlowSphere);
                
                // Scale the tree
                object.scale.set(ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE);
                break;
                
            // Removed pyramid case - replaced with more palm trees and cubes
                
            case 'cube':
                // Create a synthwave cube using shared geometry
                const cubeMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9,
                    emissive: color,
                    emissiveIntensity: 0.3
                });
                // Use pre-created geometry
                object = new THREE.Mesh(this.sharedGeometries.cube, cubeMaterial);
                
                // Add inner cube for depth using shared geometry
                const innerCubeMaterial = new THREE.MeshBasicMaterial({
                    color: color === PINK_LIGHT_COLOR ? 0xff00cc : 0x00ccff,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.8,
                    emissive: color === PINK_LIGHT_COLOR ? 0xff00cc : 0x00ccff,
                    emissiveIntensity: 0.3
                });
                const innerCube = new THREE.Mesh(this.sharedGeometries.innerCube, innerCubeMaterial);
                object.add(innerCube);
                
                // Use emissive material for glow effect instead of expensive point light
                const cubeGlowMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.5,
                    emissive: color,
                    emissiveIntensity: 0.6
                });
                
                // Add a small glowing sphere for the glow effect
                const cubeGlowSphere = new THREE.Mesh(
                    this.sharedGeometries.glowSphere3, 
                    cubeGlowMaterial
                );
                cubeGlowSphere.position.y = 1;
                object.add(cubeGlowSphere);
                
                // Scale the cube
                object.scale.set(ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE);
                break;
        }
        
        // Position the object with proper height
        // Ensure y position doesn't let object overlap with the road
        object.position.set(x, 0, z);
        
        // Add to scene and keep track of it
        this.scene.add(object);
        this.roadObjects.push(object);
    }

    /**
     * Update animations for environment elements
     * @param {boolean} gameStarted - Whether the game has started
     * @param {number} speed - The current game speed
     */
    updateEnvironment(gameStarted, speed) {
        // Always animate grid and sun, even before game starts
        // Move and animate grid - key visual element
        if (this.gridHelper) {
            // Animate main grid - more controlled movement to keep visible
            this.gridHelper.position.z += gameStarted ? speed * 1.2 : 0.15;
            
            // Reset primary grid when it gets too close to keep the infinite effect
            // But never let it go completely out of view
            if (this.gridHelper.position.z > 15) { // Reset sooner to always keep it visible
                this.gridHelper.position.z = -30;
            }
            
            // Animate all other grid helpers with smart distance management
            this.scene.children.forEach(child => {
                if (child instanceof THREE.GridHelper && child !== this.gridHelper) {
                    // Get Z position to give appropriate speed (further = slower)
                    const baseZ = Math.abs(child.position.z);
                    const speedMultiplier = 1 - (baseZ / 400); // Slower if further away
                    
                    // Move at appropriate speed
                    child.position.z += gameStarted ? speed * speedMultiplier * 1.2 : 0.1;
                    
                    // Ensure grid is never too far or too close
                    if (child.position.z > 20) {
                        // If this is the secondary grid, reset to original position
                        if (baseZ < 150) {
                            child.position.z = -120;
                        } 
                        // If this is the far grid, reset to original position
                        else {
                            child.position.z = -250;
                        }
                    }
                }
            });
            
            // Always flash the grid immediately if it's the first time running
            if (!window.gridFlashed) {
                window.gridFlashed = true;
                this.flashGrid();
            }
        }
        
        // Move the retro sun
        if (this.sun) {
            this.sun.rotation.z += SUN_ROTATION_SPEED;
        }
        
        // Animate road lines
        for (let i = 0; i < this.roadLines.length; i++) {
            const line = this.roadLines[i];
            if (line) {
                // Move lines toward the camera
                line.position.z += gameStarted ? speed * 1.5 : 0.2;
                
                // Reset position when lines pass the camera
                if (line.position.z > 15) {
                    // Reset to far distance
                    line.position.z = -500 + (i * 3); // Stagger the reset positions
                }
            }
        }
        
        // Animate road objects
        for (let i = 0; i < this.roadObjects.length; i++) {
            const object = this.roadObjects[i];
            if (object) {
                // Move objects toward the camera at higher speed to create a more dramatic effect
                object.position.z += gameStarted ? speed * 2.0 : 0.3;
                
                // Apply rotation effects for more visual interest
                object.rotation.y += 0.01;
                
                // Animate lights by pulsing their intensity slightly
                if (object.children) {
                    object.children.forEach(child => {
                        if (child instanceof THREE.PointLight) {
                            // Create pulsing effect on lights
                            child.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.8;
                            
                            // Randomize light color slightly for each object to create variation
                            if (Math.random() < 0.01) {
                                if (child.color.getHex() === PINK_LIGHT_COLOR) {
                                    child.color.setHex(0xff00cc);
                                } else if (child.color.getHex() === BLUE_LIGHT_COLOR) {
                                    child.color.setHex(0x00ccff);
                                } else {
                                    child.color.setHex(child.color.getHex() === PINK_LIGHT_COLOR ? BLUE_LIGHT_COLOR : PINK_LIGHT_COLOR);
                                }
                            }
                        }
                    });
                }
                
                // Reset position when objects pass the camera
                if (object.position.z > 15) {
                    // Reset to far distance with variation
                    object.position.z = -600 + Math.random() * 100;
                    
                    // Calculate proper side (left or right) based on the object's current x-position
                    const side = object.position.x < 0 ? -1 : 1;
                    
                    // Add random variation to x position but ensure it's FAR outside the track
                    // Track is 10 units wide (±5) and barriers are at ±5.1
                    const xVariation = 5 + (Math.random() * 10); // 5-15 units additional distance from road
                    object.position.x = side * (ROAD_OBJECT_X_OFFSET + xVariation);
                    
                    // Randomize object height for variety, but keep them grounded
                    object.position.y = (Math.random() * 0.5);
                    
                    // Randomize object scale slightly for more variety but keep reasonable
                    const scaleVariation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 range
                    const baseScale = ROAD_OBJECT_SCALE * scaleVariation;
                    object.scale.set(baseScale, baseScale, baseScale);
                }
            }
        }
    }
}

// Export a singleton instance
export const sceneManager = new SceneManager();