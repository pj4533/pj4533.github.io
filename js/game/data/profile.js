/**
 * GitHub Profile and Resume Data Module
 * Handles fetching and processing GitHub profile data and resume information
 */

import { GITHUB_COLOR, RESUME_COLOR } from '../core/constants.js';

/**
 * Fetches GitHub profile data and combines it with resume information
 * @param {string} username - GitHub username to fetch profile data for
 * @returns {Promise<Object>} - Combined profile and resume data object
 */
export async function fetchGitHubProfileData(username = 'pj4533') {
  try {
    console.log('Fetching GitHub profile data...');
    
    // Use GitHub API to get profile data
    const response = await fetch(`https://api.github.com/users/${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub profile');
    }
    
    const profile = await response.json();
    console.log('Fetched GitHub profile data successfully');
    
    // Also get additional data like languages and repos
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    const repos = await reposResponse.json();
    
    // Get languages used across repositories
    const languages = new Set();
    repos.forEach(repo => {
      if (repo.language) {
        languages.add(repo.language);
      }
    });
    
    // Get total stars
    const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    
    // Transform to profile data
    const profileData = {
      type: 'github_profile',
      name: profile.name || username,
      login: profile.login,
      bio: profile.bio,
      company: profile.company,
      blog: profile.blog,
      location: profile.location,
      email: profile.email,
      hireable: profile.hireable,
      twitter_username: profile.twitter_username,
      public_repos: profile.public_repos,
      public_gists: profile.public_gists,
      followers: profile.followers,
      following: profile.following,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      total_stars: totalStars,
      languages: Array.from(languages),
      avatar_url: profile.avatar_url,
      html_url: profile.html_url,
      repos: repos.map(repo => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updated_at: repo.updated_at
      }))
    };
    
    // Add resume data to complement GitHub data
    // This data is from PJ's actual resume (shared explicitly for this purpose)
    const resumeData = {
      experience: [
        {
          company: "Evertrue",
          location: "Boston, MA/Remote",
          title: "Sr. Principal Software Engineer",
          period: "NOV 2011 - PRESENT",
          description: "Architect, write, maintain and ship the iOS platform for all mobile applications at Evertrue. Initially using Objective C, transitioning to Swift, spread across several reusable shared libraries, including SiriKit and Spotlight search extensions."
        },
        {
          company: "Avid Technology",
          location: "Burlington, MA",
          title: "Principal Software Engineer",
          period: "DEC 1997 - OCT 2011",
          description: "Windows and Mac programming, specifically in the video domain. Wrote low level video player code, developed user interfaces, and debugged issues around video formats, frame rates and memory usage."
        },
        {
          company: "Say Goodnight Software",
          location: "",
          title: "Owner/Developer",
          period: "AUG 2008 - PRESENT",
          description: "My on-the-side iOS development company."
        }
      ],
      skills: [
        "Apple Ecosystem",
        "DJ/Vinyl Collector",
        "Eurorack Synthesizers"
      ],
      awards: [
        {
          name: "Review & Approval System Patent",
          number: "11/020,616",
          date: "Issued Jun 2009"
        },
        {
          name: "Voice Description of Time Based Media for indexing and searching Patent",
          number: "US20130007043",
          date: "Issued Jun 2011"
        }
      ],
      education: {
        school: "Missouri University of Science & Technology",
        degree: "BS, Computer Science",
        period: "1993 - 1997"
      },
      location: "Stanfordville, NY / Hudson Valley, NY"
    };
    
    // Add GitHub profile data (already collected)
    const combinedData = {
      ...profileData,
      resumeData
    };
    
    console.log('Combined data with resume included:', combinedData);
    
    return combinedData;
  } catch (error) {
    console.error('Error fetching GitHub profile:', error);
    // Return empty data structure if fetch fails
    return {
      type: 'github_profile',
      name: "PJ Gray",
      login: "pj4533",
      bio: "",
      languages: [],
      repos: [],
      resumeData: null
    };
  }
}

/**
 * Transforms GitHub profile data and resume data into collectible items for the game
 * @param {Object} data - Combined profile and resume data from fetchGitHubProfileData
 * @returns {Array} - Array of formatted display items 
 */
export function processGitHubProfileData(data) {
  console.log('Processing GitHub profile data:', data);
  console.log('Resume data present:', data.resumeData ? 'Yes' : 'No');
  
  const items = [];
  
  // Process profile information
  if (data.name) {
    items.push({
      name: data.name || data.login,
      description: "GitHub Profile",
      details: data.bio || "GitHub Developer",
      type: "profile",
      color: GITHUB_COLOR
    });
  }
  
  // Process location information from resume (prioritize resume data)
  if (data.resumeData && data.resumeData.location) {
    items.push({
      name: data.resumeData.location,
      description: "Location",
      details: "Hudson Valley, New York",
      type: "location",
      color: RESUME_COLOR,
      source: "resume"
    });
  } else if (data.location || data.company) {
    items.push({
      name: data.location || "Location",
      description: data.company || "",
      details: `GitHub since ${new Date(data.created_at).getFullYear()}`,
      type: "location",
      color: GITHUB_COLOR
    });
  }
  
  // Process stats information from GitHub
  items.push({
    name: "GitHub Stats",
    description: `${data.public_repos} Repositories`,
    details: `${data.followers} Followers • ${data.total_stars || 0} Stars`,
    type: "stats",
    color: GITHUB_COLOR
  });
  
  // Process languages (this is real data from GitHub)
  if (data.languages && data.languages.length) {
    // Group languages into batches of 3
    for (let i = 0; i < data.languages.length; i += 3) {
      const langBatch = data.languages.slice(i, i + 3);
      items.push({
        name: "Languages",
        description: langBatch.join(" • "),
        details: "GitHub Repositories",
        type: "languages",
        color: GITHUB_COLOR
      });
    }
  }
  
  // Add current job from resume data
  if (data.resumeData && data.resumeData.experience && data.resumeData.experience.length > 0) {
    const currentJob = data.resumeData.experience[0]; // First job is current (Evertrue)
    items.push({
      name: currentJob.company,
      description: currentJob.title,
      details: `${currentJob.period} • ${currentJob.location}`,
      type: "job",
      color: RESUME_COLOR,
      source: "resume"
    });
    
    // Add job description separately for readability
    console.log("Adding job details for current role:", currentJob.company);
    const jobDetails = {
      name: "Current Role",
      description: currentJob.company,
      details: currentJob.description,
      type: "job_details",
      color: RESUME_COLOR,
      source: "resume"
    };
    
    // Make a direct global reference for emergency use
    window._resumeJobDetails = jobDetails;
    
    items.push(jobDetails);
    
    // Add other jobs
    data.resumeData.experience.slice(1).forEach(job => {
      items.push({
        name: job.company,
        description: job.title,
        details: `${job.period} • ${job.location}`,
        type: "job",
        color: RESUME_COLOR,
        source: "resume"
      });
    });
  }
  
  // Add skills from resume
  if (data.resumeData && data.resumeData.skills && data.resumeData.skills.length > 0) {
    items.push({
      name: "Skills & Interests",
      description: data.resumeData.skills.join(" • "),
      details: "From Resume",
      type: "skills",
      color: RESUME_COLOR,
      source: "resume"
    });
  }
  
  // Add education from resume
  if (data.resumeData && data.resumeData.education) {
    const edu = data.resumeData.education;
    items.push({
      name: edu.school,
      description: edu.degree,
      details: edu.period,
      type: "education",
      color: RESUME_COLOR,
      source: "resume"
    });
  }
  
  // Add patents/awards from resume
  if (data.resumeData && data.resumeData.awards && data.resumeData.awards.length > 0) {
    data.resumeData.awards.forEach(award => {
      items.push({
        name: "Patent",
        description: award.name,
        details: `${award.number} • ${award.date}`,
        type: "award",
        color: RESUME_COLOR,
        source: "resume"
      });
    });
  }
  
  // Add a few select repositories (already showing these elsewhere, but include top ones)
  if (data.repos && data.repos.length) {
    // Only pick repos with stars or descriptions
    const goodRepos = data.repos
      .filter(repo => repo.stars > 0 || (repo.description && repo.description.length > 10))
      .slice(0, 5); // Limit to top 5
      
    goodRepos.forEach(repo => {
      items.push({
        name: repo.name,
        description: repo.language || "Repository",
        details: repo.description || "",
        type: "featured_repo",
        color: GITHUB_COLOR,
        stars: repo.stars
      });
    });
  }
  
  console.log(`Processed ${items.length} GitHub profile data items for the game`);
  return items;
}