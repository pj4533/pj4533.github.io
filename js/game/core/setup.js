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
    }

    /**
     * Initialize the 3D scene with all components
     * @returns {SceneManager} This instance for chaining
     */
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createStarfield();
        this.createRetroCyberpunkSun();
        this.createTrack();
        this.createRoadObjects(); // Add roadside objects
        
        // Handle window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
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
     */
    createLights() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR);
        this.scene.add(ambientLight);
        
        // Add blue point light for neon effect
        const blueLight = new THREE.PointLight(
            BLUE_LIGHT_COLOR, 
            BLUE_LIGHT_INTENSITY, 
            BLUE_LIGHT_DISTANCE
        );
        blueLight.position.set(
            BLUE_LIGHT_POSITION.x, 
            BLUE_LIGHT_POSITION.y, 
            BLUE_LIGHT_POSITION.z
        );
        this.scene.add(blueLight);
        
        // Add pink point light for neon effect
        const pinkLight = new THREE.PointLight(
            PINK_LIGHT_COLOR, 
            PINK_LIGHT_INTENSITY, 
            PINK_LIGHT_DISTANCE
        );
        pinkLight.position.set(
            PINK_LIGHT_POSITION.x, 
            PINK_LIGHT_POSITION.y, 
            PINK_LIGHT_POSITION.z
        );
        this.scene.add(pinkLight);
    }

    /**
     * Create starfield backdrop
     * @returns {THREE.Points} The created starfield
     */
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
        });
        
        const starVertices = [];
        // Create stars with random positions
        for (let i = 0; i < 700; i++) {
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
        // Create the sun circle
        this.sunGeometry = new THREE.CircleGeometry(SUN_RADIUS, SUN_SEGMENTS);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: SUN_COLOR,
            side: THREE.DoubleSide,
            wireframe: true,
        });
        
        this.sun = new THREE.Mesh(this.sunGeometry, sunMaterial);
        this.sun.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
        this.scene.add(this.sun);
        
        // Create concentric circles for retro sun effect
        for (let i = 1; i < 5; i++) {
            const ringGeometry = new THREE.RingGeometry(i * 2, i * 2 + 0.1, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? BLUE_LIGHT_COLOR : PINK_LIGHT_COLOR,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
            this.scene.add(ring);
        }
        
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
     * Create synthwave-style trees and objects on the sides of the track
     */
    createRoadObjects() {
        // Create objects for both sides of the road
        for (let side = -1; side <= 1; side += 2) { // -1 for left, 1 for right
            for (let i = 0; i < ROAD_OBJECT_COUNT; i++) {
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
                        // Create a synthwave palm tree
                        const palmTrunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
                        const palmTrunkMaterial = new THREE.MeshBasicMaterial({ 
                            color: 0x222222,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.9
                        });
                        const palmTrunk = new THREE.Mesh(palmTrunkGeometry, palmTrunkMaterial);
                        palmTrunk.position.y = 2.5;
                        
                        // Create palm tree top with multiple palm fronds
                        const palmTop = new THREE.Group();
                        palmTop.position.y = 5;
                        
                        // Create multiple palm fronds in different directions
                        for (let f = 0; f < 7; f++) {
                            const angle = (f / 7) * Math.PI * 2;
                            const bendAngle = Math.PI * 0.25; // How much the frond bends downward
                            
                            // Create a single frond as a curved shape
                            const frondShape = new THREE.Shape();
                            frondShape.moveTo(0, 0);
                            frondShape.bezierCurveTo(1, 0.5, 3, 0, 4, -0.5);
                            frondShape.lineTo(4, 0.5);
                            frondShape.bezierCurveTo(3, 1, 1, 1.5, 0, 1);
                            frondShape.lineTo(0, 0);
                            
                            // Extrude the shape to create a 3D frond
                            const frondGeometry = new THREE.ExtrudeGeometry(frondShape, {
                                steps: 1,
                                depth: 0.1,
                                bevelEnabled: false
                            });
                            
                            const frondMaterial = new THREE.MeshBasicMaterial({
                                color: color,
                                wireframe: true,
                                transparent: true,
                                opacity: 0.9
                            });
                            
                            const frond = new THREE.Mesh(frondGeometry, frondMaterial);
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
                        
                        // Add glow effects
                        const palmGlow1 = new THREE.PointLight(color, 1.5, 8);
                        palmGlow1.position.y = 5;
                        object.add(palmGlow1);
                        
                        const palmGlow2 = new THREE.PointLight(color, 1.0, 6);
                        palmGlow2.position.y = 3;
                        object.add(palmGlow2);
                        
                        // Scale the palm tree
                        object.scale.set(ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE);
                        
                        // Add random rotation for variety
                        object.rotation.y = Math.random() * Math.PI * 2;
                        break;
                        
                    case 'tree':
                        // Create a synthwave pine tree
                        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.6, 4, 8);
                        const trunkMaterial = new THREE.MeshBasicMaterial({ 
                            color: 0x333333,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.9
                        });
                        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                        
                        // Create leaves as three stacked cones
                        const leaves1Geometry = new THREE.ConeGeometry(2.5, 3, 8);
                        const leaves1Material = new THREE.MeshBasicMaterial({
                            color: color,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.9
                        });
                        const leaves1 = new THREE.Mesh(leaves1Geometry, leaves1Material);
                        leaves1.position.y = 3;
                        
                        const leaves2Geometry = new THREE.ConeGeometry(2, 2.5, 8);
                        const leaves2Material = new THREE.MeshBasicMaterial({
                            color: color === PINK_LIGHT_COLOR ? 0xff00cc : 0x00ccff,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.9
                        });
                        const leaves2 = new THREE.Mesh(leaves2Geometry, leaves2Material);
                        leaves2.position.y = 5;
                        
                        const leaves3Geometry = new THREE.ConeGeometry(1.5, 2, 8);
                        const leaves3Material = new THREE.MeshBasicMaterial({
                            color: color,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.9
                        });
                        const leaves3 = new THREE.Mesh(leaves3Geometry, leaves3Material);
                        leaves3.position.y = 7;
                        
                        // Group trunk and leaves
                        object = new THREE.Group();
                        object.add(trunk);
                        object.add(leaves1);
                        object.add(leaves2);
                        object.add(leaves3);
                        
                        // Add glow effect using multiple PointLights
                        const glow1 = new THREE.PointLight(color, 1.5, 8);
                        glow1.position.y = 5;
                        object.add(glow1);
                        
                        // Scale the tree
                        object.scale.set(ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE, ROAD_OBJECT_SCALE);
                        break;
                        
                    // Removed pyramid case - replaced with more palm trees and cubes
                        
                    case 'cube':
                        // Create a synthwave cube
                        const cubeGeometry = new THREE.BoxGeometry(2, 4, 2);
                        const cubeMaterial = new THREE.MeshBasicMaterial({
                            color: color,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.9
                        });
                        object = new THREE.Mesh(cubeGeometry, cubeMaterial);
                        
                        // Add inner cube for depth
                        const innerCubeGeometry = new THREE.BoxGeometry(1.6, 3.6, 1.6);
                        const innerCubeMaterial = new THREE.MeshBasicMaterial({
                            color: color === PINK_LIGHT_COLOR ? 0xff00cc : 0x00ccff,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.8
                        });
                        const innerCube = new THREE.Mesh(innerCubeGeometry, innerCubeMaterial);
                        object.add(innerCube);
                        
                        // Add glow effect
                        const cubeGlow = new THREE.PointLight(color, 1.5, 8);
                        cubeGlow.position.y = 1;
                        object.add(cubeGlow);
                        
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
        }
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