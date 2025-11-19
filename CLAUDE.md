# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website built as an interactive game where users catch falling shapes to discover information about the developer (pj4533). The site is a Jekyll static site hosted on GitHub Pages with a custom JavaScript game built using Three.js for 3D graphics.

## Build and Development Commands

### Local Development
```bash
bundle exec jekyll serve
```
This starts a local development server at `http://localhost:4000`. Jekyll automatically rebuilds the site when files change.

### Production Build
```bash
bundle exec jekyll build
```
Generates the static site in the `_site/` directory for deployment.

### Deployment
The site automatically deploys to GitHub Pages when changes are pushed to the `master` branch. No manual deployment steps needed.

## Architecture

### Technology Stack
- **Jekyll 3.9.0**: Static site generator
- **Three.js**: 3D graphics library for the game
- **Vanilla JavaScript (ES6 modules)**: No frameworks
- **GitHub API**: Fetches live repository and profile data

### Game Architecture

The game code is organized in `/js/game/` using ES6 modules with clear separation of concerns:

#### Core Systems (`/js/game/core/`)
- `main.js`: Entry point that imports and initializes all game components
- `constants.js`: Game configuration (colors, sizes, lanes, timing)
- `setup.js`: Three.js scene setup and initialization
- `audio.js`: Background music management

#### State Management (`/js/game/state/`)
- `gameState.js`: Centralized game state with localStorage persistence
  - Tracks score, high score, player position
  - Music preference (defaults to OFF on every page load per line 67-69)
  - Game status flags

#### Game Engine (`/js/game/engine/`)
- `gameInitializer.js`: Game setup and initialization
- `animationLoop.js`: Main game loop and frame updates
- `inputHandler.js`: Keyboard and tilt controls (arrow keys, 'M' for music)

#### Entities (`/js/game/entities/`)
- `player.js`: Creates 3D synthwave-style hot rod player model (line 10-200+)
- `collectible.js`: Base collectible interface
- `collectibles/`: Collectible types organized by category
  - `standardCollectibles.js`: GitHub repos (green) and resume (orange)
  - `factCollectibles.js`: Personal facts/trivia
  - `profileCollectibles.js`: GitHub profile information
  - `collectibleFactory.js`: Factory pattern for creating collectibles
  - `collectibleManager.js`: Spawning and collision detection
  - `collectibleEffects.js`: Visual effects when catching shapes

#### Data Providers (`/js/game/data/`)
- `github.js`: Fetches and caches GitHub API data
  - Retrieves 50 most recently updated repos (line 26)
  - Filters out forks and empty descriptions
  - Shows minimum of 10 repositories (line 56)
- `profile.js`: Fetches GitHub profile data and combines with resume info
  - Caches data to avoid repeated API calls (line 14, 19)

#### Visual Effects (`/js/game/effects/`)
- `textParticle.js`: TextParticle class for animated text
- `textEffects.js`: Text animations and particle effects

#### UI (`/js/game/ui/`)
- `interface.js`: Game UI elements and HUD

#### Utilities (`/js/game/utils/`)
- `helpers.js`: Shared utility functions

### Key Design Patterns

1. **Module Pattern**: All game code uses ES6 modules with explicit imports/exports
2. **Factory Pattern**: `collectibleFactory.js` centralizes collectible creation
3. **State Management**: Single source of truth in `gameState.js`
4. **Data Caching**: GitHub API data is cached to minimize API calls (see `githubReposCache` in `github.js:14` and `profileDataCache` in `profile.js:14`)
5. **Separation of Concerns**: Clear boundaries between rendering, logic, data, and effects

### Jekyll Structure

- `_layouts/`: Page templates
- `_includes/`: Reusable HTML components
- `_sass/`: SCSS stylesheets
- `css/`: Compiled CSS and game-specific styles
- `assets/`: Static assets (images, audio)
- `_config.yml`: Jekyll configuration with site metadata

## Important Implementation Details

### Music Behavior
Music is **always disabled on page load** regardless of previous user preferences. See `gameState.js:67-69` where `loadMusicPreferences()` always returns false. This is intentional design to avoid auto-playing audio.

### GitHub API Integration
- API calls are cached to avoid rate limiting
- Filters applied: no forks, must have descriptions, minimum 10 repos shown
- Sorted by most recent push activity (`pushed_at` field)

### Player Controls
- Arrow keys (← →) for lateral movement between lanes
- 'M' key toggles background music
- Tilt controls for mobile devices (automatically detected)

### Game Mechanics
- Player moves between fixed lanes (not free movement)
- Collectibles fall from top of screen
- Collision detection handled in `collectibleManager.js`
- Score tracked with high score persistence via localStorage

## File Naming Conventions

- JavaScript modules use camelCase (e.g., `gameState.js`, `inputHandler.js`)
- HTML/CSS files use lowercase with hyphens
- Constants are UPPER_SNAKE_CASE in `constants.js`

## Dependencies

The project has minimal external dependencies:
- Three.js (loaded via CDN in HTML)
- Jekyll plugins: `jekyll-gist`, `jekyll-seo-tag`
- Ruby gems specified in `Gemfile`

## Testing

No automated test suite exists. Testing is done manually by running the local server and playing the game.
