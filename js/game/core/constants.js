// constants.js

// Colors
export const NEON_COLORS = [0x00ffff, 0xff00ff, 0xffff00, 0xff0099, 0x00ff99];
export const GITHUB_COLOR = 0x6cc644;
export const GITHUB_DARK_COLOR = 0x2ea44f;
export const RESUME_COLOR = 0xff5700;
export const RESUME_DARK_COLOR = 0xcc4400;

// Player settings
export const PLAYER_SIZE = 0.6;
export const PLAYER_SPEED = 0.1;

// Lane settings
export const LANES = [-2, 0, 2];
export const DEFAULT_LANE = 1; // Center lane (0)

// Game levels
export const DEFAULT_LEVEL = 1;

// Collectible settings
export const GITHUB_PROFILE_ITEM_CHANCE = 1.0;
export const MAX_TIME_BETWEEN_COLLECTIBLES = 100; // ms

// Camera settings
export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;
export const CAMERA_POSITION = {x: 0, y: 1.5, z: 5};
export const CAMERA_LOOK_AT = {x: 0, y: 0, z: -10};

// Scene settings
export const SCENE_BACKGROUND_COLOR = 0x000000;
export const FOG_COLOR = 0x110022;
export const FOG_NEAR = 20;
export const FOG_FAR = 80;

// Lighting
export const AMBIENT_LIGHT_COLOR = 0x222222;
export const BLUE_LIGHT_COLOR = 0x00ffff;
export const BLUE_LIGHT_INTENSITY = 1;
export const BLUE_LIGHT_DISTANCE = 50;
export const BLUE_LIGHT_POSITION = {x: -10, y: 15, z: -30};
export const PINK_LIGHT_COLOR = 0xff00ff;
export const PINK_LIGHT_INTENSITY = 1;
export const PINK_LIGHT_DISTANCE = 50;
export const PINK_LIGHT_POSITION = {x: 10, y: 15, z: -10};

// Grid settings
export const PRIMARY_GRID_SIZE = 100;
export const PRIMARY_GRID_DIVISIONS = 50;
export const PRIMARY_GRID_COLOR1 = 0xff00ff;
export const PRIMARY_GRID_COLOR2 = 0x00ffff;
export const PRIMARY_GRID_POSITION = {x: 0, y: 0.01, z: -30};

export const SECONDARY_GRID_SIZE = 200;
export const SECONDARY_GRID_DIVISIONS = 100;
export const SECONDARY_GRID_POSITION = {x: 0, y: -0.2, z: -120};
export const SECONDARY_GRID_OPACITY = 0.6;

export const FAR_GRID_SIZE = 300;
export const FAR_GRID_DIVISIONS = 150;
export const FAR_GRID_POSITION = {x: 0, y: -0.4, z: -250};
export const FAR_GRID_OPACITY = 0.3;

// Sun settings
export const SUN_RADIUS = 10;
export const SUN_SEGMENTS = 32;
export const SUN_COLOR = 0xff00ff;
export const SUN_POSITION = {x: 0, y: 15, z: -50};
export const SUN_ROTATION_SPEED = 0.005;

// Track settings
export const TRACK_WIDTH = 10;
export const TRACK_LENGTH = 1000;
export const TRACK_COLOR = 0x000000;
export const TRACK_POSITION = {x: 0, y: 0, z: -500};

// Barrier settings
export const BARRIER_WIDTH = 0.2;
export const BARRIER_HEIGHT = 0.5;
export const BARRIER_LENGTH = 1000;
export const LEFT_BARRIER_COLOR = 0xff00ff;
export const RIGHT_BARRIER_COLOR = 0x00ffff;
export const LEFT_BARRIER_POSITION = {x: -5.1, y: 0.25, z: -500};
export const RIGHT_BARRIER_POSITION = {x: 5.1, y: 0.25, z: -500};

// Text particle settings
export const REPO_NAME_SCALE = 2.5;
export const DETAILS_SCALE = 1.5;
export const REPO_NAME_FADE_DELAY = 240;
export const DETAILS_FADE_DELAY = 120;
export const REPO_NAME_LIFE_SPEED = 0.0010;
export const DETAILS_LIFE_SPEED = 0.0025;

// Collectible positions
export const COLLECTIBLE_Z_POSITION = -50;
export const COLLECTIBLE_SCALE = 2.0;

// Animation timing
export const GRID_FLASH_INTERVAL = 120;
export const GRID_FLASH_COUNT = 8;