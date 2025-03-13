/**
 * GitHub Repository Fetcher Module
 * Handles fetching and processing GitHub repository data
 */

import { NEON_COLORS } from '../core/constants.js';

/**
 * Fetches GitHub repositories for the specified username
 * @param {string} username - GitHub username to fetch repositories for
 * @returns {Promise<Array>} - Array of processed repository objects
 */
// Cache for GitHub data
let githubReposCache = null;

export async function fetchGitHubRepos(username = 'pj4533') {
  try {
    // Use cached data if available
    if (githubReposCache) {
      console.log('Using cached GitHub repos data:', githubReposCache.length);
      return githubReposCache;
    }
    
    // Get repos sorted by most recently updated with reduced per_page to speed up initial load
    // The 'updated' sort parameter sorts by the last time the repo was pushed to
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=20`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const repos = await response.json();
    console.log('Fetched repos:', repos.length);
    
    // Filter out forks, repos without descriptions, unusual names, and repos not updated in the past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1); // Date from 1 year ago
    
    const filteredRepos = repos
      .filter(repo => {
        // Parse the update timestamp
        const lastUpdated = new Date(repo.pushed_at || repo.updated_at);
        
        // Skip forks, empty descriptions, unusual names, and repos not updated in the past year
        return !repo.fork && 
               repo.description && 
               repo.description.trim() !== '' &&
               repo.name && 
               repo.name.length > 1 && // Skip very short names
               !/^\[.*\]$/.test(repo.name) && // Skip names that are just brackets
               lastUpdated > oneYearAgo; // Only repos updated in the past year
      })
      .map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        // Handle unusual language values
        language: (repo.language && repo.language.toLowerCase() !== 'shift') ? repo.language : null,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at, // When the repo was last pushed to
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
      }));
    
    // Sort by pushed_at date (most recent commit activity first)
    filteredRepos.sort((a, b) => {
      const dateA = new Date(a.pushed_at || a.updated_at);
      const dateB = new Date(b.pushed_at || b.updated_at);
      return dateB - dateA; // Descending order (newest first)
    });
    
    console.log('Filtered repos updated in past year:', filteredRepos.length);
    
    // If we don't have any recently updated repos, relax the time constraint to 2 years
    if (filteredRepos.length === 0) {
      console.log('No repos updated in the past year, extending to 2 years');
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      filteredRepos.push(...repos
        .filter(repo => {
          const lastUpdated = new Date(repo.pushed_at || repo.updated_at);
          return !repo.fork && 
                 repo.description && 
                 repo.description.trim() !== '' &&
                 repo.name && 
                 repo.name.length > 1 &&
                 !/^\[.*\]$/.test(repo.name) &&
                 lastUpdated > twoYearsAgo && 
                 lastUpdated <= oneYearAgo;
        })
        .map(repo => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          language: (repo.language && repo.language.toLowerCase() !== 'shift') ? repo.language : null,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
        }))
      );
    }
    
    // Log the repos that will be shown
    console.log(`Showing ${filteredRepos.length} repos updated in the past ${filteredRepos.length === 0 ? '2 years' : 'year'}:`);
    
    // Store in cache for future use
    githubReposCache = filteredRepos;
    
    return filteredRepos;
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    // Fallback data in case the API fails - with current dates to ensure they're shown
    const today = new Date().toISOString();
    return [
      { 
        name: 'NeonWave', 
        description: 'A retro-styled WebGL game with Three.js', 
        language: 'JavaScript',
        pushed_at: today,
        updated_at: today,
        stars: 5,
        color: 0xff9900 
      },
      { 
        name: 'OpenPics', 
        description: 'Open source iOS app for viewing images from various services', 
        language: 'Swift',
        pushed_at: today,
        updated_at: today,
        stars: 12,
        color: 0x00ffff 
      },
      { 
        name: 'SwiftSockets', 
        description: 'A simple socket wrapper for Swift', 
        language: 'Swift',
        pushed_at: today,
        updated_at: today,
        stars: 8,
        color: 0xff00ff 
      },
      { 
        name: 'WifiMonitor', 
        description: 'Raspberry Pi based WiFi monitoring tool', 
        language: 'Python',
        pushed_at: today,
        updated_at: today,
        stars: 3,
        color: 0xffff00 
      },
      { 
        name: 'RetroUI', 
        description: 'Retro UI components for modern web applications', 
        language: 'TypeScript',
        pushed_at: today,
        updated_at: today,
        stars: 7,
        color: 0x00ff99 
      },
    ];
  }
}