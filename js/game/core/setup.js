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
    GRID_FLASH_INTERVAL, GRID_FLASH_COUNT
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

    /**
     * Flash the grid for visual effect
     */
    flashGrid() {
        const originalColors = [PRIMARY_GRID_COLOR1, PRIMARY_GRID_COLOR2];
        let flashCount = 0;
        
        // Find all grid helpers in the scene
        const allGrids = [];
        this.scene.traverse(child => {
            if (child instanceof THREE.GridHelper) {
                allGrids.push(child);
            }
        });
        
        const flashInterval = setInterval(() => {
            if (flashCount < GRID_FLASH_COUNT) {
                if (flashCount % 2 === 0) {
                    // Flash to bright white
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
                    allGrids.forEach((grid, index) => {
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
        }, GRID_FLASH_INTERVAL);
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
    }
}

// Export a singleton instance
export const sceneManager = new SceneManager();