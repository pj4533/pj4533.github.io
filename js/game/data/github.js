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
    
    // Get repos sorted by most recently updated with increased per_page to ensure we get at least 10 repos
    // The 'updated' sort parameter sorts by the last time the repo was pushed to
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=50`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const repos = await response.json();
    console.log('Fetched repos:', repos.length);
    
    // Filter out forks, repos without descriptions, and unusual names
    // We'll apply time filtering after we have enough repos
    const initialFilteredRepos = repos
      .filter(repo => {
        // Skip forks, empty descriptions, unusual names
        return !repo.fork && 
               repo.description && 
               repo.description.trim() !== '' &&
               repo.name && 
               repo.name.length > 1 && // Skip very short names
               !/^\[.*\]$/.test(repo.name); // Skip names that are just brackets
      });
    
    // Sort by pushed_at date (most recent commit activity first)
    initialFilteredRepos.sort((a, b) => {
      const dateA = new Date(a.pushed_at || a.updated_at);
      const dateB = new Date(b.pushed_at || b.updated_at);
      return dateB - dateA; // Descending order (newest first)
    });
    
    // Get at least 10 repos, starting with the most recently updated
    const minRepos = 10;
    const filteredRepos = initialFilteredRepos
      .slice(0, Math.max(minRepos, initialFilteredRepos.length))
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
    
    // Log the repos that will be shown
    console.log(`Showing ${filteredRepos.length} repos, starting with most recently updated:`);
    
    // Log individual repos for debugging
    filteredRepos.forEach((repo, index) => {
      const date = new Date(repo.pushed_at || repo.updated_at);
      console.log(`  ${index + 1}. ${repo.name} - ${date.toLocaleDateString()}`);
    });
    
    // Store in cache for future use
    githubReposCache = filteredRepos;
    
    return filteredRepos;
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    console.warn('GitHub repository data will not be displayed due to fetch error');
    // Return an empty array if the request fails
    return [];
  }
}