// Game variables
let scene, camera, renderer, player;
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;
let speed = 0.1; // Significantly reduced speed to make collectibles more visible
let obstacles = [];
let collectibles = [];

// Store the GitHub profile chance in a global variable so we can modify it temporarily
window._gitHubProfileItemChance = 1.0; // Set to 100% - always create profile/resume items instead of repo items
let level = 1;
let playerSize = 0.6;
let lanes = [-2, 0, 2];
let currentLane = 1; // Center lane (0)
let animationId;
let gridHelper;
let sunGeometry;
let sun;
let stars = [];
let neonColors = [0x00ffff, 0xff00ff, 0xffff00, 0xff0099, 0x00ff99];
let githubRepos = []; // Will hold the GitHub repository data
let profileData = []; // Will hold the GitHub profile data
let explodingTexts = []; // Will hold the exploding text particles

// This function gets GitHub profile data and combines it with resume information
// Resume data is hardcoded from actual resume provided by PJ Gray
async function fetchGitHubProfileData() {
  try {
    console.log('Fetching GitHub profile data instead of LinkedIn...');
    const username = 'pj4533';
    
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
    console.log('Resume data has expected properties:', 
      combinedData.resumeData && 
      combinedData.resumeData.experience && 
      combinedData.resumeData.skills && 
      combinedData.resumeData.education
    );
    
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

// Transform GitHub profile data and resume data into collectible items for the game
function processGitHubProfileData(data) {
  console.log('Processing GitHub profile data:', data);
  console.log('Resume data present:', data.resumeData ? 'Yes' : 'No');
  
  const items = [];
  const resumeColor = 0xff5700; // Orange color for resume data
  
  // Process profile information
  if (data.name) {
    items.push({
      name: data.name || data.login,
      description: "GitHub Profile",
      details: data.bio || "GitHub Developer",
      type: "profile",
      color: 0x6cc644 // GitHub green
    });
  }
  
  // Process location information from resume (prioritize resume data)
  if (data.resumeData && data.resumeData.location) {
    items.push({
      name: data.resumeData.location,
      description: "Location",
      details: "Hudson Valley, New York",
      type: "location",
      color: resumeColor,
      source: "resume"
    });
  } else if (data.location || data.company) {
    items.push({
      name: data.location || "Location",
      description: data.company || "",
      details: `GitHub since ${new Date(data.created_at).getFullYear()}`,
      type: "location",
      color: 0x6cc644 // GitHub green
    });
  }
  
  // Process stats information from GitHub
  items.push({
    name: "GitHub Stats",
    description: `${data.public_repos} Repositories`,
    details: `${data.followers} Followers • ${data.total_stars || 0} Stars`,
    type: "stats",
    color: 0x6cc644 // GitHub green
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
        color: 0x6cc644 // GitHub green
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
      color: resumeColor,
      source: "resume"
    });
    
    // Add job description separately for readability
    console.log("Adding job details for current role:", currentJob.company);
    const jobDetails = {
      name: "Current Role",
      description: currentJob.company,
      details: currentJob.description,
      type: "job_details",
      color: resumeColor,
      source: "resume"
    };
    console.log("Created job details item:", jobDetails);
    
    // CRITICAL FIX: Make a direct global reference for emergency use
    window._resumeJobDetails = jobDetails;
    
    items.push(jobDetails);
    
    // Add other jobs
    data.resumeData.experience.slice(1).forEach(job => {
      items.push({
        name: job.company,
        description: job.title,
        details: `${job.period} • ${job.location}`,
        type: "job",
        color: resumeColor,
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
      color: resumeColor,
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
      color: resumeColor,
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
        color: resumeColor,
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
        color: 0x6cc644, // GitHub green
        stars: repo.stars
      });
    });
  }
  
  console.log(`Processed ${items.length} GitHub profile data items for the game`);
  return items;
}

// Fetch GitHub repositories
async function fetchGitHubRepos() {
  try {
    const username = 'pj4533';
    
    // Get repos sorted by most recently updated
    // The 'updated' sort parameter sorts by the last time the repo was pushed to
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=50`);
    
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
        color: neonColors[Math.floor(Math.random() * neonColors.length)]
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
          color: neonColors[Math.floor(Math.random() * neonColors.length)]
        }))
      );
    }
    
    // Log the repos that will be shown
    console.log(`Showing ${filteredRepos.length} repos updated in the past ${filteredRepos.length === 0 ? '2 years' : 'year'}:`);
    filteredRepos.forEach(repo => {
      console.log(`- ${repo.name}: Last updated ${new Date(repo.pushed_at || repo.updated_at).toLocaleDateString()}`);
    });
    
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

// TextParticle class for exploding text
class TextParticle {
  constructor(text, position, color, isRepoName = false) {
    this.text = text;
    this.position = position.clone();
    this.isRepoName = isRepoName; // Flag to identify if this is a repo name (for special treatment)
    
    // Minimal movement for maximum readability - almost static text
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02, // Barely any horizontal movement
      (Math.random() - 0.5) * 0.01 + 0.02, // Extremely gentle upward drift
      (Math.random() - 0.5) * 0.02  // Minimal z-movement
    );
    
    // Almost no rotation for maximum readability
    this.rotation = new THREE.Vector3(
      0, // No initial x rotation
      0, // No initial y rotation
      (Math.random() - 0.5) * 0.05 // Tiny initial z rotation only
    );
    
    // Extremely slow rotation for optimal reading
    this.rotationSpeed = new THREE.Vector3(
      0, // No x rotation
      0, // No y rotation
      (Math.random() - 0.5) * 0.005 // Extremely slow z rotation only
    );
    
    this.color = color;
    this.opacity = 1;
    
    // Much larger scale, especially for repo names
    this.scale = isRepoName ? 2.5 : 1.5;
    
    // Even slower fade for maximum readability
    this.life = 1.0;
    this.lifeSpeed = isRepoName ? 0.0010 : 0.0025; // Much slower fade for better reading
    
    // Much longer delay before fading starts for better readability
    this.delayFade = isRepoName ? 240 : 120; // Significantly more frames before starting to fade
    
    this.createMesh();
  }

  createMesh() {
    try {
      // Create canvas for text with more width for longer text
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 1536; // Increased for longer text
      canvas.height = 768;  // Increased height for wrapped text
      
      // Safely convert color to hex (handle undefined or invalid colors)
      let hexColor;
      try {
        hexColor = (this.color || 0xffffff).toString(16).padStart(6, '0');
      } catch (e) {
        console.error('Color conversion error:', e);
        hexColor = 'ffffff'; // Default to white if there's a problem
      }
      
      // Create a subtler gradient for cleaner text with less glow
      const gradient = context.createLinearGradient(0, 0, canvas.width/2, canvas.height/2);
      gradient.addColorStop(0, `#${hexColor}`); 
      gradient.addColorStop(1, `#${hexColor}ee`); // Slightly transparent color (less white)
      
      // Set font properties for maximum clarity - larger and bolder font
      const fontSize = this.isRepoName ? 70 : 48; // Slightly smaller to fit more text
      context.font = `900 ${fontSize}px "JetBrains Mono", monospace`; // Extra bold weight (900)
      context.fillStyle = gradient;
      context.strokeStyle = '#000000';
      context.lineWidth = 6; // Thicker outline for better readability and contrast
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Very minimal shadow blur for maximum clarity and reduced glow
      context.shadowColor = `#${hexColor}`;
      context.shadowBlur = 4; // Significantly reduced blur for much less glow
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      
      // Make sure text is always a string
      let safeText = String(this.text || '');
      
      // Implement text wrapping for long text
      // We'll need to check if text is too long and split it into multiple lines
      const textLines = [];
      const maxLineWidth = this.isRepoName ? 1300 : 1400; // Maximum width in pixels
      
      // Measure the full text width
      const fullTextMetrics = context.measureText(safeText);
      
      if (fullTextMetrics.width > maxLineWidth) {
        // Text needs wrapping
        const words = safeText.split(' ');
        let currentLine = '';
        
        // Process each word
        words.forEach(word => {
          // Measure current line with this word added
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const testMetrics = context.measureText(testLine);
          
          if (testMetrics.width > maxLineWidth) {
            // If adding this word exceeds max width, push current line and start new line
            if (currentLine) {
              textLines.push(currentLine);
              currentLine = word;
            } else {
              // This single word is too long, we'll need to truncate it
              textLines.push(word);
              currentLine = '';
            }
          } else {
            // Add word to current line
            currentLine = testLine;
          }
        });
        
        // Add the last line if any
        if (currentLine) {
          textLines.push(currentLine);
        }
      } else {
        // No wrapping needed
        textLines.push(safeText);
      }
      
      // Calculate total height needed for all lines
      const lineHeight = fontSize * 1.2;
      const totalTextHeight = textLines.length * lineHeight;
      
      // For repository names or important text, add extra visibility features
      if (this.isRepoName) {
        // Calculate the maximum width of all lines for the background
        let maxWidth = 0;
        textLines.forEach(line => {
          const lineMetrics = context.measureText(line);
          maxWidth = Math.max(maxWidth, lineMetrics.width);
        });
        
        // Add a darker, larger background box with border for maximum contrast
        const textWidth = maxWidth;
        const textHeight = totalTextHeight;
        
        // First draw outer glow border
        context.fillStyle = `#${hexColor}33`; // Semi-transparent color matching the text
        context.fillRect(
          canvas.width/2 - textWidth/2 - 28,
          canvas.height/2 - textHeight/2 - 18,
          textWidth + 56,
          textHeight + 36
        );
        
        // Then draw solid black background
        context.fillStyle = 'rgba(0, 0, 0, 0.85)'; // Darker background
        context.fillRect(
          canvas.width/2 - textWidth/2 - 24,
          canvas.height/2 - textHeight/2 - 14,
          textWidth + 48, 
          textHeight + 28
        );
        
        // Reset fill style to gradient
        context.fillStyle = gradient;
        
        // Extremely minimal glow for maximum clarity
        context.shadowBlur = 3; // Very minimal blur for cleaner text
        context.shadowColor = `#${hexColor}`;
      }
      
      // Draw multiple lines of text
      const startY = canvas.height/2 - (totalTextHeight/2) + (lineHeight/2);
      
      textLines.forEach((line, index) => {
        const lineY = startY + (index * lineHeight);
        const textX = canvas.width/2;
        
        // Draw text (first stroke for outline, then fill)
        context.strokeText(line, textX, lineY);
        context.fillText(line, textX, lineY);
      });
      
      // Create texture from canvas (optimized settings)
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.anisotropy = 4; // Reduced anisotropy for better performance while maintaining quality
      
      // Create material with transparency (less glow effect)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: this.opacity,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending, // Standard blending for cleaner, less glowy text
        depthWrite: false, // Prevents z-fighting with other text
        depthTest: true
      });
      
      // Calculate appropriate plane dimensions based on text lines
      const planeWidth = 4.0; // Wider plane to fit more text
      
      // Calculate appropriate height based on number of text lines
      // Default is 1.5, but increase it if we have multiple lines
      const lineBreaks = safeText.split('\n');
      const lineCount = Math.max(lineBreaks.length, 1);
      
      // Apply extra height for wrapped text (detected earlier)
      const needsExtraHeight = fullTextMetrics && fullTextMetrics.width > maxLineWidth;
      const planeHeight = needsExtraHeight ? 
                         (1.5 + (0.5 * Math.floor(fullTextMetrics.width / maxLineWidth))) : 
                         (lineCount > 1 ? 1.5 + (lineCount * 0.5) : 1.5);
      
      // Create plane geometry for the text
      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      
      // Create mesh with geometry and material
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.copy(this.position);
      this.mesh.scale.set(this.scale, this.scale, this.scale);
      
      // Add the repo-text class
      this.mesh.userData.className = 'repo-text';
      
      // Make sure camera exists before looking at it
      if (camera) {
        // Always face the camera (billboard effect)
        this.mesh.lookAt(camera.position);
      }
    } catch (err) {
      console.error('Error creating text mesh:', err);
      
      // Create a fallback simple mesh if text creation fails
      const geometry = new THREE.PlaneGeometry(1, 0.5);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: this.opacity
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.copy(this.position);
    }
  }
  
  update() {
    try {
      if (!this.mesh) {
        console.error('Missing mesh in TextParticle update');
        return false; // Return false to remove this particle
      }
      
      // Update position with gentle movement
      this.position.add(this.velocity);
      this.mesh.position.copy(this.position);
      
      // Slight rotation for subtle motion but not too much to make it hard to read
      this.rotation.x += this.rotationSpeed.x;
      this.rotation.y += this.rotationSpeed.y;
      this.rotation.z += this.rotationSpeed.z;
      
      // Always look at camera first (billboard effect) if camera exists
      if (camera) {
        try {
          this.mesh.lookAt(camera.position);
          // Apply only Z rotation to keep text oriented correctly
          this.mesh.rotateZ(this.rotation.z * 0.3);
        } catch (e) {
          console.error('Error rotating text:', e);
        }
      }
      
      // Delayed fade effect - only start fading after delay
      if (this.delayFade > 0) {
        this.delayFade--;
      } else {
        this.life -= this.lifeSpeed;
        
        // For smoother fade out, especially for repo names
        if (this.isRepoName) {
          // Repo names stay fully visible longer
          this.opacity = this.life > 0.7 ? 1.0 : this.life;
        } else {
          this.opacity = this.life;
        }
        
        if (this.mesh.material) {
          this.mesh.material.opacity = this.opacity;
        }
      }
      
      // Gentle scale increase - different for repo names vs description words
      let scaleFactor;
      if (this.isRepoName) {
        // Repo names grow more slowly
        scaleFactor = 1 + (1 - this.life) * 0.3;
      } else {
        // Description words can grow a bit more
        scaleFactor = 1 + (1 - this.life) * 0.5;
      }
      
      // Apply scale (safely)
      try {
        this.mesh.scale.set(this.scale * scaleFactor, this.scale * scaleFactor, this.scale * scaleFactor);
      } catch (e) {
        console.error('Error scaling text:', e);
      }
      
      // Return true if still alive, false if should be removed
      return this.life > 0;
    } catch (err) {
      console.error('Error in TextParticle update:', err);
      return false; // Remove this particle on error
    }
  }
}

// Create exploding text effect for repositories and LinkedIn data
function createExplodingRepoText(position, item) {
  try {
    // CRITICAL FIX: Add detailed debugging
    console.log("CREATE EXPLODING REPO TEXT CALLED with item:", item);
    
    // Create unique ID for this popup to prevent conflicts
    const popupId = 'repo-popup-' + Date.now();
    
    // EMERGENCY FIX: Implement a 2D DOM-based solution since the 3D text might be failing
    // Create a DOM element to display data directly on screen
    const gameContainer = document.getElementById('game-container');
    
    // Remove any existing popups to prevent clutter 
    // (keeping max of 2 popups at once for better readability)
    const existingPopups = document.querySelectorAll('.repo-popup');
    if (existingPopups.length >= 2) {
      const oldestPopup = existingPopups[0];
      if (oldestPopup && oldestPopup.parentNode) {
        oldestPopup.parentNode.removeChild(oldestPopup);
      }
    }
    if (gameContainer) {
      // Debug the game container
      console.log("Game container found:", gameContainer);
      
      // CRITICAL FIX: Create a temporary div for displaying info
      const infoDiv = document.createElement('div');
      infoDiv.id = popupId;
      infoDiv.className = 'repo-popup';
      infoDiv.style.position = 'fixed'; // Changed from absolute to fixed
      infoDiv.style.top = '30%';
      infoDiv.style.left = '50%';
      infoDiv.style.transform = 'translate(-50%, -50%)';
      infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      infoDiv.style.color = '#00ffff';
      infoDiv.style.padding = '20px';
      infoDiv.style.borderRadius = '10px';
      infoDiv.style.border = '2px solid #00ffff';
      infoDiv.style.fontFamily = '"JetBrains Mono", monospace';
      infoDiv.style.zIndex = '9999'; // Increased z-index to ensure visibility
      infoDiv.style.textAlign = 'center';
      infoDiv.style.fontSize = '18px';
      infoDiv.style.maxWidth = '80%';
      infoDiv.style.boxShadow = '0 0 10px #00ffff';
      infoDiv.style.transition = 'all 0.3s ease-out';
      infoDiv.style.textShadow = '0 0 5px currentColor';
      infoDiv.style.opacity = '0';
      infoDiv.style.pointerEvents = 'none'; // Prevent blocking interaction
      
      // CRITICAL FIX: Add visibility forcing
      infoDiv.style.display = 'block !important';
      infoDiv.style.visibility = 'visible !important';
      
      // Add custom animation class 
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes glow {
          0% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 15px currentColor; }
          100% { box-shadow: 0 0 5px currentColor; }
        }
        
        .repo-popup {
          display: block !important;
          visibility: visible !important;
        }
      `;
      document.head.appendChild(styleSheet);
      
      infoDiv.style.animation = 'glow 1.5s infinite';
      
      // Determine if this is a GitHub or resume item
      const isResume = item.source === 'resume';
      console.log("Is resume item?", isResume, "Source:", item.source);
      
      infoDiv.style.color = isResume ? '#ff5700' : '#6cc644';
      infoDiv.style.borderColor = isResume ? '#ff5700' : '#6cc644';
      infoDiv.style.boxShadow = `0 0 10px ${isResume ? '#ff5700' : '#6cc644'}`;
      
      // Add the item name
      const titleElem = document.createElement('h2');
      titleElem.textContent = item.name || 'Unknown';
      titleElem.style.marginBottom = '10px';
      titleElem.style.textShadow = '0 0 8px currentColor';
      titleElem.style.fontSize = '24px';
      titleElem.style.fontWeight = '900';
      infoDiv.appendChild(titleElem);
      
      // Add description if available
      if (item.description) {
        const descElem = document.createElement('div');
        descElem.textContent = item.description;
        descElem.style.marginBottom = '10px';
        descElem.style.textShadow = '0 0 5px currentColor';
        descElem.style.fontSize = '18px';
        infoDiv.appendChild(descElem);
      }
      
      // Add details if available
      if (item.details) {
        const detailsElem = document.createElement('div');
        detailsElem.textContent = item.details;
        detailsElem.style.fontSize = '16px';
        detailsElem.style.opacity = '0.9';
        detailsElem.style.textShadow = '0 0 4px currentColor';
        detailsElem.style.marginTop = '5px';
        infoDiv.appendChild(detailsElem);
      }
      
      // For GitHub repos, add language and stars
      if (item.language || item.stars) {
        const metaElem = document.createElement('div');
        metaElem.style.marginTop = '10px';
        metaElem.style.fontSize = '16px';
        metaElem.style.color = '#ffff00';
        metaElem.style.textShadow = '0 0 6px #ffff00'; 
        
        if (item.language) {
          metaElem.textContent = `[${item.language}]`;
        }
        
        if (item.stars) {
          if (item.language) metaElem.textContent += ' ';
          metaElem.textContent += `★ ${item.stars}`;
        }
        
        infoDiv.appendChild(metaElem);
      }
      
      // CRITICAL FIX: Add to document body instead of game container
      document.body.appendChild(infoDiv);
      console.log("Added popup to document body:", infoDiv);
      
      // CRITICAL FIX: Force a browser reflow to ensure the element is rendered
      void infoDiv.offsetWidth;
      
      // Trigger animation by setting a timeout to allow the DOM to update
      setTimeout(() => {
        infoDiv.style.opacity = '1';
        infoDiv.style.transform = 'translate(-50%, -50%)';
        console.log("Made popup visible");
      }, 10);
      
      // Begin fade out after 5 seconds (increased from 3), then remove
      setTimeout(() => {
        if (infoDiv) {
          infoDiv.style.opacity = '0';
          infoDiv.style.transform = 'translate(-50%, -40%)';
          console.log("Starting to fade out popup");
          // Remove after fade completes
          setTimeout(() => {
            if (infoDiv && infoDiv.parentNode) {
              infoDiv.parentNode.removeChild(infoDiv);
              console.log("Removed popup from DOM");
            }
          }, 500);
        }
      }, 5000);
      
      // Position newer popups higher than older ones to prevent overlap
      const existingPopups = document.querySelectorAll('.repo-popup');
      const existingCount = existingPopups.length;
      if (existingCount > 0) {
        infoDiv.style.top = (20 + (existingCount * 10)) + '%';
      }
    } else {
      // CRITICAL FIX: If game container not found, create it
      console.error("Game container not found! Creating fallback container");
      const fallbackContainer = document.createElement('div');
      fallbackContainer.id = 'game-container';
      document.body.appendChild(fallbackContainer);
      // Try again with the new container
      createExplodingRepoText(position, item);
    }
    
    if (!item || !position) {
      console.error('Invalid item or position for exploding text');
      return;
    }
    
    // Handle GitHub profile, resume data, and GitHub repo items
    const isProfileItem = item.type && [
      'profile', 'location', 'stats', 'languages', 'featured_repo', 
      'job', 'job_details', 'skills', 'education', 'award'
    ].includes(item.type);
    
    if (isProfileItem) {
      console.log("Showing GitHub Profile item:", 
        item.name || 'Unnamed', 
        item.description || 'No description',
        "Type:", item.type);
    } else {
      console.log("Showing GitHub repo:", 
        item.name || 'Unnamed', 
        item.description || 'No description');
    }
    
    // Move item name to an optimal centered viewing position
    const namePosition = position.clone();
    namePosition.y += 0.8; // Slightly raised position
    namePosition.z -= 1; // Bring slightly closer to camera for emphasis
    
    // For profile items (both GitHub and resume), add special prefix based on type
    let displayName = item.name || 'Unnamed';
    let displayColor = item.color || 0xffff00;
    
    if (isProfileItem) {
      // Add prefix by type
      switch(item.type) {
        // GitHub profile data
        case 'profile':
          displayName = `👤 ${displayName}`;
          break;
        case 'location':
          displayName = `📍 ${displayName}`;
          break;
        case 'stats':
          displayName = `📊 ${displayName}`;
          break;
        case 'languages':
          displayName = `💻 ${displayName}`;
          break;
        case 'featured_repo':
          displayName = `⭐ ${displayName}`;
          break;
          
        // Resume data
        case 'job':
          displayName = `🏢 ${displayName}`;
          break;
        case 'job_details':
          displayName = `💼 ${displayName}`;
          break;
        case 'skills':
          displayName = `🔧 ${displayName}`;
          break;
        case 'education':
          displayName = `🎓 ${displayName}`;
          break;
        case 'award':
          displayName = `🏆 ${displayName}`;
          break;
      }
      
      // Use the item's color (resume items use orange, GitHub items use green)
      displayColor = item.color || 0x6cc644;
    }

    // Ensure name is valid and properly formatted
    const displayNameFormatted = String(displayName).toUpperCase();
    
    // Create particle for name with isNameFlag set to true
    const nameParticle = new TextParticle(displayNameFormatted, namePosition, displayColor, true);
    
    // Only add to scene if mesh was created successfully
    if (nameParticle.mesh) {
      scene.add(nameParticle.mesh);
      explodingTexts.push(nameParticle);
    }
    
    // Always show description if available
    if (item.description && item.description.trim() !== '') {
      setTimeout(() => {
        // Position description below the name with more vertical space
        const descPosition = namePosition.clone();
        descPosition.y -= 1.2; // Increased space between name and description
        
        // Create description text
        const descText = isProfileItem 
          ? item.description
          : `[${item.description}]`;
        
        const descParticle = new TextParticle(descText, descPosition, displayColor, true);
        
        if (descParticle.mesh) {
          scene.add(descParticle.mesh);
          explodingTexts.push(descParticle);
        }
      }, 300); // Longer delay for better reading of the name first
    }
    
    // For GitHub repos, add language and stars information if available
    // There's no LinkedIn items anymore, always check for language/stars
    if (item.language || item.stars) {
      setTimeout(() => {
        let infoText = '';
        // Only add language if it exists and isn't unusual
        if (item.language && item.language.length > 1 && item.language.toLowerCase() !== 'shift') {
          infoText += `[${item.language}]`;
        }
        
        // Add stars if available
        if (item.stars && item.stars > 0) infoText += ` ★ ${item.stars}`;
        
        // Only proceed if we have valid info text
        if (infoText && infoText.trim() !== '') {
          // Position at bottom with more space
          const infoPosition = namePosition.clone();
          infoPosition.y -= item.description ? 2.2 : 1.2; // Increased vertical spacing
          
          // Create info text particle
          const infoParticle = new TextParticle(infoText, infoPosition, 0xffff00, true);
          
          if (infoParticle.mesh) {
            scene.add(infoParticle.mesh);
            explodingTexts.push(infoParticle);
          }
        }
      }, 500); // Delay even more for better readability
    }
    
    // For GitHub profile items, add details information if available
    if (isProfileItem && item.details && item.details.trim() !== '') {
      setTimeout(() => {
        // Position details below description with more consistent spacing
        const detailsPosition = namePosition.clone();
        detailsPosition.y -= item.description ? 2.2 : 1.2; // Match GitHub info spacing
        
        // Format the details text - we'll let the text wrapping handle long text now
        // rather than truncating with ellipsis
        let detailsText = item.details;
        
        // If we're dealing with long details text, add more bottom padding
        if (detailsText.length > 60) {
          // Adjust vertical position even more for very long text
          detailsPosition.y -= 0.2;
        }
        
        const detailsParticle = new TextParticle(detailsText, detailsPosition, 0x2ea44f, true); // GitHub darker green
        
        if (detailsParticle.mesh) {
          scene.add(detailsParticle.mesh);
          explodingTexts.push(detailsParticle);
        }
      }, 500); // Match GitHub info timing
    }
  } catch (err) {
    console.error('Error creating repo text effect:', err);
  }
}

// Initialize the game
function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Modified fog for better grid visibility - pushed further back
  scene.fog = new THREE.Fog(0x110022, 20, 80); // Much broader fog range (20 near, 80 far)
  
  // Create camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.5, 5);
  camera.lookAt(0, 0, -10);
  
  // Create renderer with post-processing effects
  try {
    // First clear the game-canvas element to ensure clean state
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
      // Clear any previous content
      gameCanvas.innerHTML = '';
      
      // Create the renderer with explicit pixel ratio
      renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Add the canvas element to the DOM
      gameCanvas.appendChild(renderer.domElement);
      
      // Force display style to ensure visibility
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      
      console.log('WebGL renderer created and attached successfully');
    } else {
      console.error('Game canvas element not found!');
    }
  } catch (e) {
    console.error('Error creating WebGL renderer:', e);
  }
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);
  
  // Add point lights for neon effect
  const blueLight = new THREE.PointLight(0x00ffff, 1, 50);
  blueLight.position.set(-10, 15, -30);
  scene.add(blueLight);
  
  const pinkLight = new THREE.PointLight(0xff00ff, 1, 50);
  pinkLight.position.set(10, 15, -10);
  scene.add(pinkLight);
  
  // Create starfield backdrop
  createStarfield();
  
  // Create retro sun
  createRetroCyberpunkSun();
  
  // Create track
  createTrack();
  
  // Create player
  createPlayer();
  
  // Fetch both GitHub repositories and GitHub profile data
  console.log('Loading GitHub repositories and profile data...');
  
  // Fetch both data sources in parallel
  Promise.all([
    fetchGitHubRepos(),
    fetchGitHubProfileData()
  ]).then(([repos, profile]) => {
    // Store GitHub repo data
    githubRepos = repos;
    console.log('Loaded GitHub repos:', githubRepos.length);
    
    // Process and store GitHub profile data
    profileData = processGitHubProfileData(profile);
    console.log('Loaded GitHub profile data items:', profileData.length);
    
    // Only fetch data once at launch - no automatic refreshes
    console.log('All GitHub data loaded on launch - will refresh on each game start');
  }).catch(error => {
    console.error('Error loading GitHub data:', error);
  });
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
  
  // Add key events listener
  document.addEventListener('keydown', handleKeyDown);
  
  // Initial UI setup
  updateScore(0);
  
  // Check local storage for high score
  try {
    if (localStorage.getItem('neonWaveHighScore')) {
      highScore = parseInt(localStorage.getItem('neonWaveHighScore'));
      console.log('Loaded high score:', highScore);
    }
  } catch (err) {
    console.error('Error loading high score:', err);
  }
  
  // Start animation loop
  animate();
  
  // Flash the grid immediately when the page loads for emphasis
  setTimeout(flashGrid, 500);
}

// Handle keyboard input
function handleKeyDown(event) {
  // Prevent default action for arrow keys and space
  if (event.key === ' ' || 
      event.key === 'ArrowLeft' || 
      event.key === 'ArrowRight' || 
      event.key === 'ArrowUp' || 
      event.key === 'ArrowDown') {
    event.preventDefault();
  }
  
  // Handle spacebar to start the game
  if (event.key === ' ') {
    if (!gameStarted) {
      startGame();
      return;
    }
    
    // We can also use spacebar as an alternative to show a random repo
    if (Math.random() < 0.05) { // Increased chance to trigger fun repo fact
      if (githubRepos.length > 0) {
        const randomRepo = githubRepos[Math.floor(Math.random() * githubRepos.length)];
        
        // Create a special centered text effect
        const center = new THREE.Vector3(0, 1.5, 0);
        createExplodingRepoText(center, randomRepo);
      }
    }
  }
  
  // Add R key to refresh the game and repos
  if (event.key === 'r' || event.key === 'R') {
    if (gameStarted) {
      refreshGame();
      return;
    }
  }
  
  // Only handle movement if game is active
  if (!gameStarted) return;
  
  // Handle movement with arrow keys
  if (event.key === 'ArrowLeft') {
    if (currentLane > 0) {
      currentLane--;
      player.rotation.z = 0.2;
      setTimeout(() => {
        if (player) player.rotation.z = 0;
      }, 200);
    }
  } else if (event.key === 'ArrowRight') {
    if (currentLane < 2) {
      currentLane++;
      player.rotation.z = -0.2;
      setTimeout(() => {
        if (player) player.rotation.z = 0;
      }, 200);
    }
  }
}

// Create starfield backdrop (optimized)
function createStarfield() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
  });
  
  const starVertices = [];
  // Reduced number of stars for better performance
  for (let i = 0; i < 700; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = -Math.random() * 100;
    starVertices.push(x, y, z);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// Create a retro cyberpunk sun
function createRetroCyberpunkSun() {
  // Create the sun circle
  sunGeometry = new THREE.CircleGeometry(10, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    side: THREE.DoubleSide,
    wireframe: true,
  });
  
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.z = -50;
  sun.position.y = 15;
  scene.add(sun);
  
  // Create concentric circles for retro sun effect
  for (let i = 1; i < 5; i++) {
    const ringGeometry = new THREE.RingGeometry(i * 2, i * 2 + 0.1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x00ffff : 0xff00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.z = -50;
    ring.position.y = 15;
    scene.add(ring);
  }
}

// Create the game track
function createTrack() {
  // Main track is dark with grid lines
  const trackGeometry = new THREE.PlaneGeometry(10, 1000);
  const trackMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    wireframe: false
  });
  const track = new THREE.Mesh(trackGeometry, trackMaterial);
  track.rotation.x = -Math.PI / 2;
  track.position.z = -500;
  scene.add(track);
  
  // Add prominent 80s-style neon grid lines - main visual element
  // Create multiple grid layers for more depth and visibility - moved closer to be always visible
  
  // Primary grid - positioned much closer to be immediately visible
  gridHelper = new THREE.GridHelper(100, 50, 0xff00ff, 0x00ffff);
  gridHelper.position.y = 0.01; // Just above the track
  gridHelper.position.z = -30; // Positioned much closer to be immediately visible
  // Make grid lines thicker for better visibility
  if (gridHelper.material) {
    gridHelper.material.linewidth = 2; // May not work in all browsers but worth trying
  }
  scene.add(gridHelper);
  
  // Secondary grid - also positioned closer
  const secondaryGrid = new THREE.GridHelper(200, 100, 0xff00ff, 0x00ffff);
  secondaryGrid.position.y = -0.2; // Below the main grid
  secondaryGrid.position.z = -120; // Much closer than before, but still behind primary
  secondaryGrid.material.opacity = 0.6; // More visible
  secondaryGrid.material.transparent = true;
  scene.add(secondaryGrid);
  
  // Add a third grid for even more depth effect
  const farGrid = new THREE.GridHelper(300, 150, 0xff00ff, 0x00ffff);
  farGrid.position.y = -0.4; // Even lower
  farGrid.position.z = -250; // Far but still visible
  farGrid.material.opacity = 0.3;
  farGrid.material.transparent = true;
  scene.add(farGrid);
  
  // Add lane markers
  for (let lane of lanes) {
    const markerGeometry = new THREE.PlaneGeometry(0.1, 1000);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.x = lane;
    marker.position.y = 0.01;
    marker.position.z = -500;
    marker.rotation.x = -Math.PI / 2;
    scene.add(marker);
  }
  
  // Add side barriers with neon effect
  const leftBarrierGeometry = new THREE.BoxGeometry(0.2, 0.5, 1000);
  const rightBarrierGeometry = new THREE.BoxGeometry(0.2, 0.5, 1000);
  
  const leftBarrierMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  const rightBarrierMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  
  const leftBarrier = new THREE.Mesh(leftBarrierGeometry, leftBarrierMaterial);
  const rightBarrier = new THREE.Mesh(rightBarrierGeometry, rightBarrierMaterial);
  
  leftBarrier.position.x = -5.1;
  leftBarrier.position.y = 0.25;
  leftBarrier.position.z = -500;
  
  rightBarrier.position.x = 5.1;
  rightBarrier.position.y = 0.25;
  rightBarrier.position.z = -500;
  
  scene.add(leftBarrier);
  scene.add(rightBarrier);
}

// Create player - 80s style car
function createPlayer() {
  // Create car body
  const carGroup = new THREE.Group();
  
  // Main body - neon colored hovercar
  const bodyGeometry = new THREE.BoxGeometry(playerSize + 0.1, playerSize / 2, playerSize + 0.3);
  const bodyMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.5
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  carGroup.add(body);
  
  // Top part
  const topGeometry = new THREE.BoxGeometry(playerSize - 0.1, playerSize / 3, playerSize - 0.1);
  const topMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x0000ff,
    emissive: 0x0000ff,
    emissiveIntensity: 0.2
  });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.y = 0.25;
  carGroup.add(top);
  
  // Add lights for the car
  const frontLightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const frontLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  
  const leftLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
  leftLight.position.set(-0.2, 0, 0.3);
  carGroup.add(leftLight);
  
  const rightLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
  rightLight.position.set(0.2, 0, 0.3);
  carGroup.add(rightLight);
  
  // Add neon glow
  const playerLight = new THREE.PointLight(0x00ffff, 1, 3);
  playerLight.position.set(0, 0.5, 0);
  carGroup.add(playerLight);
  
  // Position the whole car
  carGroup.position.y = playerSize / 2;
  carGroup.position.z = 0;
  carGroup.position.x = lanes[currentLane];
  
  player = carGroup;
  scene.add(player);
}

// Create obstacles - glitchy retro objects
function createObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const obstacleType = Math.floor(Math.random() * 3);
  let obstacle;
  
  switch (obstacleType) {
    case 0: // Glitchy cube
      const cubeGroup = new THREE.Group();
      
      // Main glitchy cube
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        wireframe: true,
        transparent: true,
        opacity: 0.9
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cubeGroup.add(cube);
      
      // Add glitching effect with multiple frames that randomly display
      for (let i = 0; i < 3; i++) {
        const glitchFrame = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.3
          })
        );
        glitchFrame.visible = false;
        cubeGroup.add(glitchFrame);
      }
      
      // Add intense red glow
      const cubeLight = new THREE.PointLight(0xff0000, 1, 3);
      cubeLight.position.set(0, 0, 0);
      cubeGroup.add(cubeLight);
      
      // Set up glitching animation
      setInterval(() => {
        if (cubeGroup.parent) {  // Check if still in the scene
          // Randomly show/hide glitch frames
          cubeGroup.children.forEach((child, index) => {
            if (index > 0 && index < 4) { // Skip the main cube and light
              child.visible = Math.random() > 0.7;
              child.rotation.x = Math.random() * Math.PI;
              child.rotation.z = Math.random() * Math.PI;
            }
          });
          
          // Randomly scale the main cube
          cube.scale.set(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
          );
        }
      }, 80);
      
      obstacle = cubeGroup;
      break;
      
    case 1: // VHS static-like noise
      const noiseGroup = new THREE.Group();
      
      // Create multiple glitchy planes
      for (let i = 0; i < 5; i++) {
        const noiseGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.6);
        const noiseColor = (i % 2 === 0) ? 0xff3333 : 0xff0000;
        const noiseMaterial = new THREE.MeshLambertMaterial({ 
          color: noiseColor,
          emissive: noiseColor,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.9
        });
        const noisePlane = new THREE.Mesh(noiseGeometry, noiseMaterial);
        noisePlane.position.y = -0.25 + (i * 0.1);
        noiseGroup.add(noisePlane);
      }
      
      // Add intense red warning light
      const noiseLight = new THREE.PointLight(0xff0000, 1.5, 4);
      noiseLight.position.set(0, 0, 0);
      noiseGroup.add(noiseLight);
      
      // Set up glitching
      setInterval(() => {
        if (noiseGroup.parent) {  // Check if still in the scene
          noiseGroup.children.forEach((child, index) => {
            if (index < 5) { // Only affect the planes, not the light
              // Randomly change opacity and position
              child.material.opacity = 0.7 + Math.random() * 0.3;
              child.position.x = (Math.random() - 0.5) * 0.3;
              child.position.y = -0.25 + (index * 0.1) + (Math.random() - 0.5) * 0.1;
              child.scale.x = 0.8 + Math.random() * 0.5;
            }
          });
        }
      }, 50);
      
      obstacle = noiseGroup;
      break;
      
    case 2: // Computer virus symbol
      const virusGroup = new THREE.Group();
      
      // Create multiple tetrahedrons that overlap
      for (let i = 0; i < 3; i++) {
        const baseGeometry = new THREE.TetrahedronGeometry(0.6, 0);
        const baseMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xff0000,
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });
        const baseShape = new THREE.Mesh(baseGeometry, baseMaterial);
        baseShape.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        virusGroup.add(baseShape);
      }
      
      // Add flashing sphere in center
      const sphereGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      virusGroup.add(sphere);
      
      // Stronger red warning light
      const warning = new THREE.PointLight(0xff0000, 2, 5);
      warning.position.set(0, 0, 0);
      virusGroup.add(warning);
      
      // Set up pulsing animation
      setInterval(() => {
        if (virusGroup.parent) {
          // Flash the sphere
          sphere.material.opacity = 0.4 + Math.random() * 0.6;
          sphere.scale.set(
            0.8 + Math.random() * 0.5,
            0.8 + Math.random() * 0.5,
            0.8 + Math.random() * 0.5
          );
          
          // Rotate the tetrahedrons randomly
          virusGroup.children.forEach((child, index) => {
            if (index < 3) { // Only affect the tetrahedrons
              child.rotation.x += (Math.random() - 0.5) * 0.2;
              child.rotation.z += (Math.random() - 0.5) * 0.2;
            }
          });
        }
      }, 100);
      
      obstacle = virusGroup;
      break;
  }
  
  // Position the obstacle
  obstacle.position.x = lanes[lane];
  obstacle.position.y = 0.5;
  obstacle.position.z = -100;
  obstacle.scale.set(1.2, 1.2, 1.2);
  
  scene.add(obstacle);
  obstacles.push(obstacle);
}

