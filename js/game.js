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

// Create collectible item - 80s icons with LinkedIn and GitHub data
function createCollectible() {
  const lane = Math.floor(Math.random() * 3);
  
  // Determine if this should be a GitHub profile collectible (using the configurable chance)
  const isProfileItem = profileData.length > 0 && Math.random() < window._gitHubProfileItemChance;
  
  // For standard collectibles, choose a random type
  const collectibleType = Math.floor(Math.random() * 4);
  
  let collectible;
  const colorIndex = Math.floor(Math.random() * neonColors.length);
  const itemColor = isProfileItem ? 0x6cc644 : neonColors[colorIndex]; // GitHub green for profile items
  
  // Store the data source and item in the collectible's userData
  const userData = {};
  
  if (isProfileItem) {
    // Choose a random profile data item if available
    if (profileData && profileData.length > 0) {
      // Important: Filter profile items to include GitHub and resume items separately
      const resumeItems = profileData.filter(item => item.source === 'resume');
      const githubItems = profileData.filter(item => item.source !== 'resume');
      
      console.log('Available profile items - Resume:', resumeItems.length, 'GitHub:', githubItems.length);
      
      // Randomly choose between resume (50% chance) or GitHub (50% chance) when both are available
      let selectedItems = resumeItems.length > 0 && (Math.random() < 0.5 || githubItems.length === 0) ? 
                        resumeItems : githubItems;
                        
      // Make sure we have something to select from
      if (selectedItems.length === 0) {
        selectedItems = profileData; // Fall back to all items if the filtered array is empty
      }
      
      // Choose a random item from the selected items
      const randomIndex = Math.floor(Math.random() * selectedItems.length);
      userData.dataSource = 'profile';
      userData.dataItem = selectedItems[randomIndex];
      
      console.log('Selected item type:', userData.dataItem.type, 'source:', userData.dataItem.source || 'github');
    } else {
      // If no profile data is available yet, just mark as profile source
      userData.dataSource = 'profile';
      userData.dataItem = {
        name: "Profile Data",
        description: "Loading profile data...",
        type: "profile",
        color: 0x6cc644
      };
    }
    
    // Get the item to determine color
    const dataItem = userData.dataItem;
    // Debug the item to see if it has the correct source
    console.log('Profile data item:', dataItem);
    
    // Ensure we're detecting resume items consistently
    // Item should have a source property of 'resume'
    const isResumeItem = dataItem && dataItem.source === 'resume';
    console.log('Is resume item?', isResumeItem);
    
    // IMPORTANT: Use orange color for resume items, GitHub green for GitHub items
    const itemColor = isResumeItem ? 0xff5700 : 0x6cc644; // Orange for resume, green for GitHub
    const innerColor = isResumeItem ? 0xcc4400 : 0x2ea44f; // Darker variant
    
    // For profile items, use a special shape - holographic octahedron or diamond
    const pyramidGroup = new THREE.Group();
    
    // Choose geometry based on source
    let pyramidGeometry, innerGeometry;
    if (isResumeItem) {
      // Resume items use diamond shape (octahedron)
      pyramidGeometry = new THREE.OctahedronGeometry(0.35, 0);
      innerGeometry = new THREE.OctahedronGeometry(0.25, 0);
    } else {
      // GitHub items use octahedron shape
      pyramidGeometry = new THREE.OctahedronGeometry(0.35, 0);
      innerGeometry = new THREE.OctahedronGeometry(0.25, 0);
    }
    
    // Create outer wireframe
    const pyramidMaterial = new THREE.MeshBasicMaterial({ 
      color: itemColor,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const pyramidWireframe = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramidGroup.add(pyramidWireframe);
    
    // Create inner solid
    const innerMaterial = new THREE.MeshBasicMaterial({ 
      color: innerColor,
      transparent: true,
      opacity: 0.3
    });
    const innerPyramid = new THREE.Mesh(innerGeometry, innerMaterial);
    pyramidGroup.add(innerPyramid);
    
    // Add symbol on one face - GH for GitHub, CV for resume
    const addSymbol = () => {
      // Create canvas for text
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      
      // Draw text based on source
      context.fillStyle = '#FFFFFF';
      context.font = 'bold 32px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      if (isResumeItem) {
        context.fillText('CV', 64, 64); // CV for resume/curriculum vitae
      } else {
        context.fillText('GH', 64, 64); // GH for GitHub
      }
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create material with texture
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      // Create plane for the face
      const plane = new THREE.PlaneGeometry(0.3, 0.3);
      const textMesh = new THREE.Mesh(plane, material);
      textMesh.position.set(0, 0.1, 0.2);
      textMesh.lookAt(0, 0.5, 1);
      
      return textMesh;
    };
    
    pyramidGroup.add(addSymbol());
    
    // Add strong glow light
    const pyramidLight = new THREE.PointLight(itemColor, 1.5, 3);
    pyramidLight.position.set(0, 0, 0);
    pyramidGroup.add(pyramidLight);
    
    collectible = pyramidGroup;
    
    // Add special animation function for this collectible
    collectible.userData = {
      ...userData,
      animate: function(time) {
        // Rotate the wireframe and inner shape differently
        pyramidWireframe.rotation.y += 0.01;
        innerPyramid.rotation.y -= 0.005;
        innerPyramid.rotation.x += 0.003;
      }
    };
    
    return collectible;
  }
  
  // For standard collectibles, store that this is a GitHub item
  userData.dataSource = 'github';
  // We don't set userData.dataItem for GitHub items yet - that will be selected at display time
  
  switch (collectibleType) {
    case 0: // Cassette tape
      const cassetteGroup = new THREE.Group();
      
      // Create cassette body
      const tapeBody = new THREE.BoxGeometry(0.6, 0.1, 0.4);
      const tapeMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor,
        emissive: itemColor
      });
      const tape = new THREE.Mesh(tapeBody, tapeMaterial);
      cassetteGroup.add(tape);
      
      // Add cassette label
      const labelGeometry = new THREE.BoxGeometry(0.4, 0.01, 0.25);
      const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.y = 0.06;
      cassetteGroup.add(label);
      
      // Add cassette holes
      const holeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8);
      const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      const hole1 = new THREE.Mesh(holeGeometry, holeMaterial);
      hole1.rotation.z = Math.PI / 2;
      hole1.position.set(-0.15, 0, 0.2);
      cassetteGroup.add(hole1);
      
      const hole2 = new THREE.Mesh(holeGeometry, holeMaterial);
      hole2.rotation.z = Math.PI / 2;
      hole2.position.set(0.15, 0, 0.2);
      cassetteGroup.add(hole2);
      
      // Add neon glow
      const tapeLight = new THREE.PointLight(itemColor, 1, 2);
      tapeLight.position.set(0, 0, 0);
      cassetteGroup.add(tapeLight);
      
      collectible = cassetteGroup;
      break;
      
    case 1: // Retro game controller
      const controllerGroup = new THREE.Group();
      
      // Controller body
      const controllerGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
      const controllerMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor,
        emissive: itemColor
      });
      const controller = new THREE.Mesh(controllerGeometry, controllerMaterial);
      controllerGroup.add(controller);
      
      // D-pad
      const dpadBaseGeometry = new THREE.BoxGeometry(0.18, 0.02, 0.18);
      const dpadBaseMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const dpadBase = new THREE.Mesh(dpadBaseGeometry, dpadBaseMaterial);
      dpadBase.position.set(-0.2, 0.06, 0);
      controllerGroup.add(dpadBase);
      
      // Action buttons
      const buttonGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
      const buttonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      
      const button1 = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button1.rotation.x = Math.PI / 2;
      button1.position.set(0.15, 0.06, -0.05);
      controllerGroup.add(button1);
      
      const button2 = new THREE.Mesh(buttonGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
      button2.rotation.x = Math.PI / 2;
      button2.position.set(0.25, 0.06, -0.05);
      controllerGroup.add(button2);
      
      // Add controller light
      const controllerLight = new THREE.PointLight(itemColor, 1, 2);
      controllerLight.position.set(0, 0.1, 0);
      controllerGroup.add(controllerLight);
      
      collectible = controllerGroup;
      break;
      
    case 2: // Vinyl record
      const recordGroup = new THREE.Group();
      
      // Main record disk
      const recordGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 32);
      const recordMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const record = new THREE.Mesh(recordGeometry, recordMaterial);
      record.rotation.x = Math.PI / 2;
      recordGroup.add(record);
      
      // Add record label in the center
      const labelRadius = 0.1;
      const recordLabelGeometry = new THREE.CylinderGeometry(labelRadius, labelRadius, 0.025, 32);
      const recordLabelMaterial = new THREE.MeshBasicMaterial({ color: itemColor });
      const recordLabel = new THREE.Mesh(recordLabelGeometry, recordLabelMaterial);
      recordLabel.rotation.x = Math.PI / 2;
      recordLabel.position.z = 0.003;
      recordGroup.add(recordLabel);
      
      // Add center hole
      const holeGeometry2 = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16);
      const holeMaterial2 = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const hole = new THREE.Mesh(holeGeometry2, holeMaterial2);
      hole.rotation.x = Math.PI / 2;
      recordGroup.add(hole);
      
      // Add neon reflection/glow
      const recordLight = new THREE.PointLight(itemColor, 1.5, 3);
      recordLight.position.set(0, 0, 0);
      recordGroup.add(recordLight);
      
      collectible = recordGroup;
      break;
      
    case 3: // Holographic pyramid
      const pyramidGroup = new THREE.Group();
      
      // Create outer wireframe
      const pyramidGeometry = new THREE.TetrahedronGeometry(0.4, 0);
      const pyramidMaterial = new THREE.MeshBasicMaterial({ 
        color: itemColor,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const pyramidWireframe = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
      pyramidGroup.add(pyramidWireframe);
      
      // Create inner solid with holographic effect
      const innerGeometry = new THREE.TetrahedronGeometry(0.3, 0);
      const innerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
      });
      const innerPyramid = new THREE.Mesh(innerGeometry, innerMaterial);
      pyramidGroup.add(innerPyramid);
      
      // Add strong glow light
      const pyramidLight = new THREE.PointLight(itemColor, 1.5, 3);
      pyramidLight.position.set(0, 0, 0);
      pyramidGroup.add(pyramidLight);
      
      collectible = pyramidGroup;
      
      // Add special animation function for this collectible
      collectible.userData = {
        animate: function(time) {
          // Rotate the wireframe and inner pyramid differently
          pyramidWireframe.rotation.y += 0.01;
          innerPyramid.rotation.y -= 0.005;
          innerPyramid.rotation.x += 0.003;
        }
      };
      break;
  }
  
  // Position the collectible
  collectible.position.x = lanes[lane];
  collectible.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.2; // Floating effect
  
  // Scale up collectibles to make them much more visible
  collectible.scale.set(2.0, 2.0, 2.0); // Double the size for maximum visibility
  
  // Position collectibles much closer to the player for frequent encounters
  collectible.position.z = -50 - Math.random() * 5; // Much closer to camera (-50 vs -90)
  
  // Store user data in all collectible types
  try {
    // Initialize userData if it doesn't exist
    if (!collectible.userData) {
      collectible.userData = {};
    }
    
    // Add dataSource and dataItem if not already set
    if (!collectible.userData.dataSource) {
      collectible.userData.dataSource = userData.dataSource || 'github';
    }
    
    // CRITICAL FIX: Make sure dataItem is properly set in userData for both standard collectibles and profile items
    if (userData.dataItem && !collectible.userData.dataItem) {
      collectible.userData.dataItem = userData.dataItem;
    }
    
    // This code block was for LinkedIn data, which is not used anymore
    // We now use GitHub and resume data instead
  } catch (error) {
    console.error('Error setting collectible userData:', error);
  }
  
  scene.add(collectible);
  collectibles.push(collectible);
}

// Handle window resize
function onWindowResize() {
  // Update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Resize renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Re-position UI elements if needed
  if (window.innerHeight < 500) {
    // Adjust for small screens
    document.getElementById('instructions').style.display = 'none';
  } else {
    document.getElementById('instructions').style.display = 'block';
  }
}

// This function used to update score, but we've removed scoring
// Keeping an empty function to avoid breaking existing calls
function updateScore(newScore) {
  // Score tracking removed - purely for showing GitHub projects
}

// Camera shake effect (for obstacle collisions)
function shakeCamera(intensity = 0.5) {
  const originalPosition = camera.position.clone();
  const shakeDuration = 20; // frames
  let shakeFrame = 0;
  
  function doShake() {
    if (shakeFrame < shakeDuration) {
      // Calculate decreasing intensity
      const currentIntensity = intensity * (1 - shakeFrame / shakeDuration);
      
      // Apply random offset to camera
      camera.position.x = originalPosition.x + (Math.random() - 0.5) * currentIntensity;
      camera.position.y = originalPosition.y + (Math.random() - 0.5) * currentIntensity;
      
      shakeFrame++;
      requestAnimationFrame(doShake);
    } else {
      // Reset camera position after shake
      camera.position.copy(originalPosition);
    }
  }
  
  doShake();
}

// Check collisions
function checkCollisions() {
  // No obstacle collisions - only collectibles for repo display
  
  // CRITICAL FIX: Reset game state each time to ensure we can always show repos
  // This prevents state from getting stuck
  window.gameState = {
    isShowingRepo: false,
    lastRepoShownTime: 0
  };
  
  const currentTime = Date.now();
  // No cooldown needed since we reset state every time

  // Check collectible collisions
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const collectible = collectibles[i];
    
    // Check if collectible is too far behind
    if (collectible.position.z > 10) {
      scene.remove(collectible);
      collectibles.splice(i, 1);
      continue;
    }
    
    // Check for collectible pickup
    const distance = player.position.distanceTo(collectible.position);
    if (distance < playerSize + 0.7) {
      // CRITICAL FIX: Always show repos by forcing shouldShowRepo to true
      // This ensures items always display when collected
      const shouldShowRepo = true;
      
      // Create collection effect with repo display now forced on
      createCollectionEffect(collectible.position.x, collectible.position.y, collectible.position.z, shouldShowRepo);
      
      // CRITICAL FIX: No need to update state or set timeout since we reset state on every collision check
      // This ensures we never get stuck in a state where new items can't be displayed
      
      // Remove collectible
      scene.remove(collectible);
      collectibles.splice(i, 1);
      
      // Occasionally flash grid for visual interest
      if (Math.random() < 0.2) { // 20% chance on collection
        flashGrid();
      }
    }
  }
}

// Create explosion effect when player hits obstacle (optimized)
function createExplosion(x, y, z) {
  const particleCount = 15; // Reduced by half for better performance
  const particles = [];
  
  // Reuse geometries and materials for better performance
  const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const particleMaterial1 = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 1
  });
  const particleMaterial2 = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 1
  });
  
  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(
      particleGeometry,
      i % 2 === 0 ? particleMaterial1 : particleMaterial2
    );
    
    particle.position.set(x, y, z);
    particle.velocity = {
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.2, 
      z: (Math.random() - 0.5) * 0.2
    };
    
    scene.add(particle);
    particles.push(particle);
  }
  
  // Animate particles
  const animateParticles = () => {
    // Always animate particles (removed gameOver check)
    particles.forEach(particle => {
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.position.z += particle.velocity.z;
      
      particle.material.opacity -= 0.02;
      
      if (particle.material.opacity <= 0) {
        scene.remove(particle);
      }
    });
    
    // Continue animation if particles exist
    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  };
  
  animateParticles();
}

// Create collection effect when player picks up collectible (optimized)
function createCollectionEffect(x, y, z, showRepo = true) {
  // Create expanding ring (simplified geometry for performance)
  const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 16); // Reduced segments
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  });
  
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(x, y, z);
  ring.rotation.y = Math.PI / 2;
  scene.add(ring);
  
  // Create particles burst effect - fewer particles for better performance
  const particleCount = 6; // Further reduced for better performance
  const particles = [];
  
  // Reuse geometries and materials for better performance
  const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const particleMaterial1 = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 1
  });
  const particleMaterial2 = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 1
  });
  
  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(
      particleGeometry, 
      i % 2 === 0 ? particleMaterial1 : particleMaterial2
    );
    
    particle.position.set(x, y, z);
    particle.velocity = {
      x: (Math.random() - 0.5) * 0.1,
      y: (Math.random() - 0.5) * 0.1 + 0.05, // Slight upward bias
      z: (Math.random() - 0.5) * 0.1
    };
    
    scene.add(particle);
    particles.push(particle);
  }
  
  // Add point light flash (same as before)
  const pointLight = new THREE.PointLight(0xffffff, 2, 5);
  pointLight.position.set(x, y, z);
  scene.add(pointLight);
  
  // CRITICAL FIX: Debug point - add a forced display alert
  console.log("COLLECTION EFFECT - showRepo value:", showRepo);
  
  // Display collected item info if available AND if showRepo flag is true
  if (showRepo) {
    // Check if this collectible had specific data assigned to it
    // If we can identify what this collectible is, show that specific data
    let dataSource = 'github'; // Default to GitHub
    let dataItem = null;
    
    // CRITICAL FIX: Debug showRepo value
    console.log('ShowRepo is true, attempting to display data');
    
    // Use the collectible's userData directly if possible
    try {
      // Try to get from the collectible that was just collected
      // CRITICAL FIX: Scan all collectibles just before they're removed
      const collectedItem = collectibles.find(c => 
        Math.abs(c.position.x - x) < 0.5 && 
        Math.abs(c.position.y - y) < 0.5 && 
        Math.abs(c.position.z - z) < 0.5
      );
      
      console.log('Found collected item:', collectedItem);
      
      if (collectedItem && collectedItem.userData) {
        console.log('Collectible userData:', collectedItem.userData);
        if (collectedItem.userData.dataSource) {
          dataSource = collectedItem.userData.dataSource;
        }
        if (collectedItem.userData.dataItem) {
          dataItem = collectedItem.userData.dataItem;
          console.log('Profile data item source:', dataItem.source);
        }
      }
      
      // CRITICAL FIX: If we couldn't find the data from the collectible, use resume data as fallback
      if (!dataItem) {
        console.log("No data item found for collectible - using fallback data");
        
        // Prioritize resume data for fallback
        const resumeItems = profileData ? profileData.filter(item => item.source === 'resume') : [];
        if (resumeItems && resumeItems.length > 0) {
          // Get a random resume item as fallback
          const randomIndex = Math.floor(Math.random() * resumeItems.length);
          dataItem = resumeItems[randomIndex];
          dataSource = 'profile';
          console.log("Using fallback RESUME data:", dataItem);
        }
        // Only fall back to GitHub data if no resume data is available
        else if (profileData && profileData.length > 0) {
          const randomIndex = Math.floor(Math.random() * profileData.length);
          dataItem = profileData[randomIndex];
          dataSource = 'profile';
          console.log("Using fallback profile data:", dataItem);
        } 
        else if (githubRepos && githubRepos.length > 0) {
          const randomIndex = Math.floor(Math.random() * githubRepos.length);
          dataItem = githubRepos[randomIndex];
          dataSource = 'github';
          console.log("Using fallback GitHub repo data:", dataItem);
        }
        
        // CRITICAL FIX: Last resort - create a dummy item if nothing else works
        if (!dataItem) {
          console.log("Creating emergency dummy data item");
          dataItem = {
            name: "Resume Data",
            description: "Professional Experience",
            details: "Your resume data will appear here",
            source: "resume",
            type: "job_details",
            color: 0xff5700
          };
        }
      }
    } catch (error) {
      console.error('Error accessing collectible userData:', error);
      // Fall back to creating a dummy item
      dataItem = {
        name: "Resume Data",
        description: "Professional Experience",
        details: "Error retrieving data, please try again",
        source: "resume",
        type: "job_details",
        color: 0xff5700
      };
    }
    
    console.log('Ready to display data - source:', dataSource, 'dataItem:', dataItem);
    
    // CRITICAL FIX: Always try to display something
    // Force display even if dataItem is somehow still null
    if (dataItem) {
      console.log('Displaying data item, source:', dataSource);
      
      // CRITICAL FIX: Force the popup to display by calling function directly
      createExplodingRepoText(new THREE.Vector3(x, y, z), dataItem);
      
      // CRITICAL FIX: Also try an emergency fallback DOM display 
      try {
        const emergencyDiv = document.createElement('div');
        emergencyDiv.style.position = 'fixed';
        emergencyDiv.style.top = '50%';
        emergencyDiv.style.left = '50%';
        emergencyDiv.style.transform = 'translate(-50%, -50%)';
        emergencyDiv.style.zIndex = '99999';
        emergencyDiv.style.backgroundColor = 'black';
        emergencyDiv.style.color = dataItem.source === 'resume' ? '#ff5700' : '#6cc644';
        emergencyDiv.style.padding = '20px';
        emergencyDiv.style.borderRadius = '10px';
        emergencyDiv.style.fontWeight = 'bold';
        emergencyDiv.style.fontSize = '24px';
        emergencyDiv.textContent = dataItem.name + ': ' + (dataItem.description || '');
        
        document.body.appendChild(emergencyDiv);
        
        setTimeout(() => {
          if (emergencyDiv.parentNode) {
            emergencyDiv.parentNode.removeChild(emergencyDiv);
          }
        }, 5000);
      } catch (e) {
        console.error("Emergency display failed:", e);
      }
      
      // Refresh GitHub profile data occasionally
      if (Math.random() < 0.15) { // 15% chance to refresh
        console.log('Refreshing GitHub profile data...');
        fetchGitHubProfileData().then(profile => {
          profileData = processGitHubProfileData(profile);
          console.log('GitHub profile data refreshed with', profileData.length, 'items');
        }).catch(err => {
          console.error('Error refreshing GitHub profile data:', err);
        });
      }
    } else {
      console.error("CRITICAL ERROR: Still couldn't find any data to display!");
    }
      
    // Always cycle through repositories to ensure variety
    if (githubRepos && githubRepos.length > 1) {
      const usedRepo = githubRepos.shift(); // Remove from front
      githubRepos.push(usedRepo); // Add to end
    }
      
    // Refresh GitHub data occasionally
    if (Math.random() < 0.1) { // 10% chance to refresh
      console.log('Refreshing GitHub repos...');
      fetchGitHubRepos().then(repos => {
        githubRepos = repos;
        console.log('GitHub repos refreshed with', githubRepos.length, 'repositories');
      }).catch(err => {
        console.error('Error refreshing GitHub data:', err);
      });
    }
  }
  
  // Animate expanding ring and particles
  let scale = 0.1;
  const animate = () => {
    if (scale < 3) {
      // Animate ring
      scale += 0.15;
      ring.scale.set(scale, scale, scale);
      ring.material.opacity = 1 - scale / 3;
      ring.rotation.z += 0.02;
      
      // Animate particles
      particles.forEach(particle => {
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;
        particle.position.z += particle.velocity.z;
        particle.material.opacity -= 0.02;
        particle.rotation.x += 0.1;
        particle.rotation.y += 0.1;
      });
      
      // Fade out light
      pointLight.intensity = 2 * (1 - scale / 3);
      
      requestAnimationFrame(animate);
    } else {
      // Clean up
      scene.remove(ring);
      particles.forEach(particle => scene.remove(particle));
      scene.remove(pointLight);
    }
  };
  
  animate();
}

// Enhanced flash grid effect for visual impact
function flashGrid() {
  const originalColors = [0xff00ff, 0x00ffff];
  let flashCount = 0;
  
  // Find all grid helpers in the scene
  const allGrids = [];
  scene.traverse(child => {
    if (child instanceof THREE.GridHelper) {
      allGrids.push(child);
    }
  });
  
  const flashInterval = setInterval(() => {
    if (flashCount < 8) { // More flashes for emphasis
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
            if (grid !== gridHelper) {
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
  }, 120); // Slightly slower flash for better effect
}

// No game over functionality needed

// Start the game
function startGame() {
  console.log("Starting game!");
  
  // Make sure the game hasn't already started
  if (gameStarted) return;
  
  // Set game state
  gameStarted = true;
  gameOver = false; // Keep this for compatibility but don't use it
  
  // Hide the start screen
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.classList.add('hidden');
    console.log("Start screen hidden:", startScreen.classList.contains('hidden'));
  } else {
    console.error("Start screen element not found!");
  }
  
  updateScore(0);
  
  // Initialize the last collectible time to ensure timely collectible creation
  lastCollectibleTime = Date.now();
  
  // Start with an extra strong grid flash for emphasis
  setTimeout(() => {
    flashGrid();
    // Double flash for emphasis
    setTimeout(flashGrid, 800);
  }, 100);
  
  // Only create collectibles - no obstacles
  // Create many more initial collectibles with a deliberate mix of profile/repo items
  // Guarantee exposure to GitHub profile data
  for (let i = 0; i < 50; i++) { // Dramatically increased from 20 to 50 for maximum visibility
    // Force more GitHub profile items at the beginning to ensure exposure to profile data
    // For the first 14 collectibles, prefer profile items (70% chance)
    // This ensures players will see GitHub profile data early and often
    const forceHighProfileChance = i < 14;
    
    // Create the collectible - temporarily override the random chance for initial collectibles
    const originalChance = window._gitHubProfileItemChance;
    if (forceHighProfileChance) {
      window._gitHubProfileItemChance = 0.7; // 70% chance of profile item for initial collectibles
    }
    
    createCollectible();
    
    // Restore original chance
    window._gitHubProfileItemChance = originalChance;
    
    // Distribute collectibles extremely close together to create a dense field
    // Super close positions for maximum visibility and frequency
    collectibles[i].position.z = -15 - (i * 1.0); // Position them extremely close for maximum visibility
    
    // Distribute them across all lanes to ensure all areas have collectibles
    collectibles[i].position.x = lanes[i % 3];
  }
  
  // Create initial welcome text displays to show the player what to expect
  setTimeout(() => {
    // First welcome message about GitHub
    const center1 = new THREE.Vector3(-2, 1.5, -5);
    const welcomeGithub = {
      name: "CATCH GITHUB REPOS",
      description: "DISCOVER MY LATEST PROJECTS",
      language: "GitHub",
      stars: 0,
      color: 0xffff00
    };
    createExplodingRepoText(center1, welcomeGithub);
    
    // Second welcome message about GitHub Profile
    setTimeout(() => {
      const center2 = new THREE.Vector3(2, 1.5, -5);
      const welcomeProfile = {
        name: "CATCH RESUME DATA",
        description: "WORK HISTORY & SKILLS",
        type: "job",
        color: 0xff5700,
        source: "resume"
      };
      createExplodingRepoText(center2, welcomeProfile);
      
      // Refresh data on game start to ensure fresh content
      fetchGitHubRepos().then(repos => {
        githubRepos = repos;
        console.log('GitHub repos refreshed with', githubRepos.length, 'repositories');
      });
      
      fetchGitHubProfileData().then(profile => {
        profileData = processGitHubProfileData(profile);
        console.log('GitHub profile data refreshed with', profileData.length, 'items');
      });
      
    }, 800);
  }, 1000); // Show intro messages after short delays
}

// Refresh the game - can be triggered manually if needed
function refreshGame() {
  // Reset basic game parameters but don't stop gameplay
  speed = 0.1; // Keep speed very slow for maximum visibility
  level = 1;
  
  // Clear obstacles and collectibles
  for (const obstacle of obstacles) {
    scene.remove(obstacle);
  }
  obstacles = [];
  
  for (const collectible of collectibles) {
    scene.remove(collectible);
  }
  collectibles = [];
  
  // Keep current text particles - they'll fade naturally
  
  // Reset player position to current lane
  player.position.set(lanes[currentLane], playerSize / 2, 0);
  player.rotation.set(0, 0, 0);
  
  // Reset score
  updateScore(0);
  
  // Flash grid for visual effect
  flashGrid();
  
  // Use existing repo data - no additional fetch
  if (githubRepos && githubRepos.length > 0) {
    console.log('Using existing GitHub repos:', githubRepos.length);
    
    // Show newest repo as an announcement
    setTimeout(() => {
      const newestRepo = githubRepos[0];
      const center = new THREE.Vector3(0, 2, -3);
      createExplodingRepoText(center, newestRepo);
    }, 500);
  }
  
  // Ensure GitHub profile data is loaded
  if (profileData.length === 0) {
    console.log('Loading GitHub profile data on refresh...');
    fetchGitHubProfileData().then(profile => {
      profileData = processGitHubProfileData(profile);
      console.log('GitHub profile data loaded with', profileData.length, 'items');
      
      // Show GitHub profile as an announcement
      if (profileData.length > 0) {
        setTimeout(() => {
          const profileItem = profileData.find(item => item.type === 'profile') || profileData[0];
          const center = new THREE.Vector3(0, 2, -3);
          createExplodingRepoText(center, profileItem);
        }, 1000);
      }
    });
  } else {
    console.log('Using existing GitHub profile data:', profileData.length, 'items');
  }
  
  // Create new collectibles - more of them since they're the only interactive elements
  // Guarantee a steady stream of collectibles with no gaps and high GitHub profile exposure
  for (let i = 0; i < 20; i++) {
    // Force more GitHub profile items at the beginning to ensure exposure to profile data
    // For the first 14 collectibles, prefer profile items (70% chance)
    // This ensures players will see GitHub profile data early and often
    const forceHighProfileChance = i < 14;
    
    // Create the collectible - temporarily override the random chance for initial collectibles
    const originalChance = window._gitHubProfileItemChance;
    if (forceHighProfileChance) {
      window._gitHubProfileItemChance = 0.7; // 70% chance of profile item for initial collectibles
    }
    
    createCollectible();
    
    // Restore original chance
    window._gitHubProfileItemChance = originalChance;
    
    // Distribute collectibles extremely close together to create a dense field
    collectibles[i].position.z = -15 - (i * 1.0); // Position them extremely close for maximum visibility
    
    // Distribute them across all lanes to ensure all areas have collectibles
    collectibles[i].position.x = lanes[i % 3];
  }
  
  // Reset the last collectible time
  lastCollectibleTime = Date.now();
}

// Track last collectible creation time
let lastCollectibleTime = 0;
const MAX_TIME_BETWEEN_COLLECTIBLES = 100; // Maximum 0.1 seconds between collectibles for extremely high frequency

// Animation loop
function animate() {
  try {
    animationId = requestAnimationFrame(animate);
    
    // Track current time for guaranteed collectible spawns
    const currentTime = Date.now();
    
    // Always animate grid and sun, even before game starts
    // Move and animate grid - key visual element
    if (gridHelper) {
      // Animate main grid - much more controlled movement to keep visible
      gridHelper.position.z += gameStarted ? speed * 1.2 : 0.15;
      
      // Reset primary grid when it gets too close to keep the infinite effect
      // But never let it go completely out of view
      if (gridHelper.position.z > 15) { // Reset much sooner to always keep it visible
        gridHelper.position.z = -30;
      }
      
      // Animate all other grid helpers with smart distance management
      scene.children.forEach(child => {
        if (child instanceof THREE.GridHelper && child !== gridHelper) {
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
        flashGrid();
      }
    }
    
    // Move the retro sun and stars
    if (sun) {
      sun.rotation.z += 0.005;
    }
  
    // Update exploding text particles
    for (let i = explodingTexts.length - 1; i >= 0; i--) {
      try {
        const textParticle = explodingTexts[i];
        if (!textParticle || !textParticle.update) {
          // Invalid particle, remove it
          console.warn('Invalid text particle found, removing');
          if (textParticle && textParticle.mesh) {
            scene.remove(textParticle.mesh);
          }
          explodingTexts.splice(i, 1);
          continue;
        }
        
        const isAlive = textParticle.update();
        
        if (!isAlive) {
          // Remove dead particles from scene and array
          if (textParticle.mesh) {
            scene.remove(textParticle.mesh);
          }
          explodingTexts.splice(i, 1);
        }
      } catch (err) {
        console.error('Error updating text particle:', err);
        // Remove problematic particle
        try {
          if (explodingTexts[i] && explodingTexts[i].mesh) {
            scene.remove(explodingTexts[i].mesh);
          }
        } catch (e) {
          // Ignore further errors in cleanup
        }
        explodingTexts.splice(i, 1);
      }
    }
    
    if (gameStarted) {
      // Move player to target lane if player exists
      if (player) {
        player.position.x += (lanes[currentLane] - player.position.x) * 0.1;
        
        // Rotate wheels or add hover effect
        if (player.children && player.children.length > 0) {
          player.children.forEach(child => {
            try {
              // Add slight bobbing motion to simulate hovering
              child.position.y = Math.sin(Date.now() * 0.005) * 0.03;
            } catch (e) {
              console.error('Error updating player child:', e);
            }
          });
        }
      }
      
      // Move obstacles with error handling
      for (let i = obstacles.length - 1; i >= 0; i--) {
        try {
          const obstacle = obstacles[i];
          obstacle.position.z += speed;
          
          // Different rotation effects based on obstacle type
          if (obstacle.children && obstacle.children[0] && obstacle.children[0].geometry) {
            // For group objects
            obstacle.rotation.z += 0.03;
          }
        } catch (err) {
          console.error('Error updating obstacle:', err);
          // Remove problematic obstacle
          if (obstacles[i]) {
            try {
              scene.remove(obstacles[i]);
            } catch (e) {
              // Ignore further errors
            }
            obstacles.splice(i, 1);
          }
        }
      }
      
      // Move collectibles with error handling
      for (let i = collectibles.length - 1; i >= 0; i--) {
        try {
          const collectible = collectibles[i];
          collectible.position.z += speed;
          
          // Check for special animation function
          if (collectible.userData && collectible.userData.animate) {
            collectible.userData.animate(Date.now());
          } else {
            // Different animation based on collectible type
            collectible.rotation.y += 0.02;
          }
          
          // Floating effect
          collectible.position.y = 0.5 + Math.sin(Date.now() * 0.002 + collectible.position.x) * 0.2;
        } catch (err) {
          console.error('Error updating collectible:', err);
          // Remove problematic collectible
          if (collectibles[i]) {
            try {
              scene.remove(collectibles[i]);
            } catch (e) {
              // Ignore further errors
            }
            collectibles.splice(i, 1);
          }
        }
      }
      
      // Only create collectibles - no obstacles
      try {
        // Check if it's been too long since the last collectible was created
        const timeSinceLastCollectible = currentTime - lastCollectibleTime;
        
        // Either create by random chance or force creation if it's been too long
        // Dramatically increased chance to 80% for extremely high frequency of collectibles
        if (Math.random() < 0.80 || timeSinceLastCollectible > MAX_TIME_BETWEEN_COLLECTIBLES) {
          createCollectible();
          lastCollectibleTime = currentTime;
        }
        
        // Check collisions
        checkCollisions();
      } catch (err) {
        console.error('Error in game logic:', err);
      }
      
      // No refresh in animation loop - using initial data only
    }
    
    // Render scene
    if (renderer && scene && camera) {
      try {
        // Force visibility of the renderer DOM element
        if (renderer.domElement) {
          renderer.domElement.style.display = 'block';
          renderer.domElement.style.width = '100%';
          renderer.domElement.style.height = '100%';
        }
        
        // Make sure the camera aspect ratio is correct
        if (camera.aspect !== window.innerWidth / window.innerHeight) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // Render the scene
        renderer.render(scene, camera);
        
        // Mark that we've had at least one successful render
        window._renderSuccessful = true;
        
        // Debug renderer status
        if (window._debugRendering) {
          console.log('Rendering frame, camera position:', camera.position);
          window._debugRendering = false;
        }
      } catch (e) {
        console.error('Error during rendering:', e);
      }
    } else {
      console.error('Cannot render: missing renderer, scene or camera', {
        renderer: !!renderer, 
        scene: !!scene, 
        camera: !!camera
      });
    }
  } catch (err) {
    console.error('Critical error in animation loop:', err);
    // Try to recover by requesting next frame
    requestAnimationFrame(animate);
  }
}

// Initialize the game when the page loads with safety checks
// Debug flag to track renderer status
window._debugRendering = true;
window._renderSuccessful = false;

// Add a fallback DOM display function for data as a safety measure
function createFallbackDisplay() {
  console.log("Creating fallback DOM display for data...");
  const container = document.getElementById('game-container');
  if (!container) return;
  
  // Create a visible DOM element to show some data in case WebGL fails
  const fallbackDiv = document.createElement('div');
  fallbackDiv.id = 'fallback-data-display';
  fallbackDiv.style.position = 'absolute';
  fallbackDiv.style.top = '50%';
  fallbackDiv.style.left = '50%';
  fallbackDiv.style.transform = 'translate(-50%, -50%)';
  fallbackDiv.style.width = '80%';
  fallbackDiv.style.maxHeight = '80%';
  fallbackDiv.style.overflow = 'auto';
  fallbackDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  fallbackDiv.style.color = '#00ffff';
  fallbackDiv.style.padding = '20px';
  fallbackDiv.style.borderRadius = '10px';
  fallbackDiv.style.zIndex = '900';
  fallbackDiv.style.textAlign = 'center';
  fallbackDiv.style.border = '2px solid #00ffff';
  fallbackDiv.style.boxShadow = '0 0 10px #00ffff';
  fallbackDiv.style.fontFamily = '"JetBrains Mono", monospace';
  
  const header = document.createElement('h2');
  header.textContent = "GitHub Projects & Resume Data";
  header.style.textShadow = '0 0 5px #00ffff';
  fallbackDiv.appendChild(header);
  
  // Add notice about the game not being visible
  const notice = document.createElement('p');
  notice.textContent = "The 3D game is not displaying correctly. Here's the data that would normally be shown in the game:";
  notice.style.margin = '10px 0 20px 0';
  fallbackDiv.appendChild(notice);
  
  // Add profile data
  if (profileData && profileData.length > 0) {
    const itemsContainer = document.createElement('div');
    itemsContainer.style.display = 'grid';
    itemsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    itemsContainer.style.gap = '15px';
    
    for (let i = 0; i < Math.min(profileData.length, 8); i++) {
      const item = profileData[i];
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '15px';
      itemDiv.style.borderRadius = '5px';
      itemDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      itemDiv.style.border = `1px solid ${item.source === 'resume' ? '#ff5700' : '#6cc644'}`;
      
      const title = document.createElement('h3');
      title.textContent = item.name || '';
      title.style.margin = '0 0 10px 0';
      title.style.color = item.source === 'resume' ? '#ff5700' : '#6cc644';
      title.style.textShadow = `0 0 5px ${item.source === 'resume' ? '#ff5700' : '#6cc644'}`;
      itemDiv.appendChild(title);
      
      if (item.description) {
        const desc = document.createElement('p');
        desc.textContent = item.description;
        desc.style.margin = '5px 0';
        itemDiv.appendChild(desc);
      }
      
      if (item.details) {
        const details = document.createElement('p');
        details.textContent = item.details;
        details.style.fontSize = '0.9em';
        details.style.opacity = '0.8';
        itemDiv.appendChild(details);
      }
      
      itemsContainer.appendChild(itemDiv);
    }
    
    fallbackDiv.appendChild(itemsContainer);
  }
  
  // Add GitHub repos if available
  if (githubRepos && githubRepos.length > 0) {
    const reposHeader = document.createElement('h3');
    reposHeader.textContent = "GitHub Repositories";
    reposHeader.style.margin = '20px 0 10px 0';
    reposHeader.style.color = '#6cc644';
    reposHeader.style.textShadow = '0 0 5px #6cc644';
    fallbackDiv.appendChild(reposHeader);
    
    const reposContainer = document.createElement('div');
    reposContainer.style.display = 'grid';
    reposContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    reposContainer.style.gap = '15px';
    
    for (let i = 0; i < Math.min(githubRepos.length, 6); i++) {
      const repo = githubRepos[i];
      const repoDiv = document.createElement('div');
      repoDiv.style.padding = '15px';
      repoDiv.style.borderRadius = '5px';
      repoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      repoDiv.style.border = '1px solid #6cc644';
      
      const title = document.createElement('h4');
      title.textContent = repo.name || '';
      title.style.margin = '0 0 10px 0';
      title.style.color = '#6cc644';
      title.style.textShadow = '0 0 5px #6cc644';
      repoDiv.appendChild(title);
      
      if (repo.description) {
        const desc = document.createElement('p');
        desc.textContent = repo.description;
        desc.style.margin = '5px 0';
        desc.style.fontSize = '0.9em';
        repoDiv.appendChild(desc);
      }
      
      const meta = document.createElement('p');
      meta.style.fontSize = '0.8em';
      meta.style.color = '#ffff00';
      meta.style.textShadow = '0 0 5px #ffff00';
      meta.textContent = [
        repo.language ? `[${repo.language}]` : '',
        repo.stars ? `★ ${repo.stars}` : ''
      ].filter(Boolean).join(' ');
      repoDiv.appendChild(meta);
      
      reposContainer.appendChild(repoDiv);
    }
    
    fallbackDiv.appendChild(reposContainer);
  }
  
  // Add a close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.marginTop = '20px';
  closeBtn.style.padding = '8px 16px';
  closeBtn.style.backgroundColor = '#ff00ff';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '5px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.textShadow = '0 0 5px #ff00ff';
  closeBtn.style.boxShadow = '0 0 10px #ff00ff';
  closeBtn.onclick = function() {
    fallbackDiv.remove();
  };
  fallbackDiv.appendChild(closeBtn);
  
  container.appendChild(fallbackDiv);
}

// Create a global function to force data display in case graphics still fail
window.forceShowData = function() {
  createFallbackDisplay();
};

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded, starting initialization...');
  
  // Create a fallback timeout to show data if rendering fails
  setTimeout(function() {
    if (!window._renderSuccessful) {
      console.warn("No successful renders detected - creating fallback data display");
      createFallbackDisplay();
    }
  }, 5000);
  
  // Check if WebGL is supported
  function checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }
  
  // Check if WebGL is supported
  if (!checkWebGLSupport()) {
    console.error('WebGL not supported in this browser!');
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; text-align: center; color: #ff00ff; border: 2px solid #ff00ff;"><h2>WebGL Not Supported</h2><p>Your browser does not support WebGL, which is required to run this game.</p><p>Please try using a different browser or update your current one.</p></div>';
    }
    return;
  }
  
  // Create a function to verify and fix any display issues
  function checkGameDisplayStatus() {
    const gameCanvas = document.getElementById('game-canvas');
    if (!gameCanvas || gameCanvas.children.length === 0) {
      console.warn('Game canvas not properly initialized, attempting recovery...');
      try {
        if (!renderer) {
          console.log('Reinitializing game...');
          init();
          return;
        }
        
        // Make sure renderer is attached
        if (renderer.domElement && gameCanvas) {
          gameCanvas.innerHTML = '';
          gameCanvas.appendChild(renderer.domElement);
          renderer.domElement.style.display = 'block';
          renderer.domElement.style.width = '100%';
          renderer.domElement.style.height = '100%';
          console.log('Renderer reattached to DOM');
        }
      } catch (e) {
        console.error('Error during display recovery:', e);
      }
    }
  }
  
  // Check display status after a short delay
  setTimeout(checkGameDisplayStatus, 1000);
  
  // Check for THREE before trying to initialize
  if (typeof THREE === 'undefined') {
    console.error('THREE is not defined! Attempting to load Three.js directly...');
    
    // Try to load Three.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.min.js'; // Use newer version
    
    script.onload = function() {
      console.log('Three.js loaded successfully!');
      // Initialize game after loading
      try {
        init();
        console.log('Game initialized successfully');
      } catch (err) {
        console.error('Error during game initialization:', err);
        alert('Error initializing game. Please check the console for details.');
      }
    };
    
    // Handle loading error
    script.onerror = function() {
      console.error('Failed to load Three.js!');
      // Try an alternative CDN
      const backupScript = document.createElement('script');
      backupScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r150/three.min.js';
      backupScript.onload = function() {
        console.log('Three.js loaded from backup CDN successfully!');
        try {
          init();
        } catch (err) {
          console.error('Error during game initialization with backup Three.js:', err);
        }
      };
      document.head.appendChild(backupScript);
    };
    
    document.head.appendChild(script);
  } else {
    // THREE is available, initialize normally
    console.log('THREE is already defined, initializing game...');
    try {
      init();
      console.log('Game initialized successfully');
    } catch (err) {
      console.error('Error during game initialization:', err);
      alert('Error initializing game. Please check the console for details.');
    }
  }
});

// CRITICAL FIX: Create a global emergency resume data item for testing
window._createEmergencyResumeData = function() {
  console.log("Creating emergency resume data");
  return {
    name: "Current Role",
    description: "Evertrue",
    details: "Architect, write, maintain and ship the iOS platform for all mobile applications at Evertrue. Initially using Objective C, transitioning to Swift, spread across several reusable shared libraries, including SiriKit and Spotlight search extensions.",
    type: "job_details",
    color: 0xff5700,
    source: "resume"
  };
};

// CRITICAL FIX: Force display a test popup to verify DOM element creation works
window._testPopupDisplay = function() {
  console.log("Testing popup display");
  const testItem = window._resumeJobDetails || window._createEmergencyResumeData();
  
  // Create a simple fixed position popup
  const testDiv = document.createElement('div');
  testDiv.style.position = 'fixed';
  testDiv.style.top = '50%';
  testDiv.style.left = '50%';
  testDiv.style.transform = 'translate(-50%, -50%)';
  testDiv.style.zIndex = '99999';
  testDiv.style.backgroundColor = 'black';
  testDiv.style.color = '#ff5700';
  testDiv.style.padding = '20px';
  testDiv.style.borderRadius = '10px';
  testDiv.style.fontWeight = 'bold';
  testDiv.style.fontSize = '24px';
  testDiv.style.border = '2px solid #ff5700';
  testDiv.textContent = `TEST POPUP: ${testItem.name}: ${testItem.description}`;
  
  document.body.appendChild(testDiv);
  
  setTimeout(() => {
    if (testDiv.parentNode) {
      testDiv.parentNode.removeChild(testDiv);
    }
  }, 3000);
  
  return "Test popup created";
};

// CRITICAL FIX: Enhanced keyboard event handling to ensure space bar works
window.addEventListener('keydown', function(event) {
  console.log("Key pressed:", event.key, event.code);
  
  // CRITICAL FIX: Add test key (T key) to force display a test popup
  if (event.key === 't' || event.key === 'T') {
    console.log("TEST KEY PRESSED");
    window._testPopupDisplay();
    return;
  }
  
  // Handle the space key for controlling the game
  if (event.key === ' ' || event.code === 'Space') {
    // Prevent page scrolling
    event.preventDefault();
    
    // Handle game state
    if (!gameStarted) {
      console.log("Game not started, calling startGame()");
      startGame();
    } else {
      console.log("Game already started");
    }
  }
  
  // Also handle keyboard controls directly here as a fallback
  if (gameStarted) {
    if (event.key === 'ArrowLeft' || event.code === 'ArrowLeft') {
      // Move left
      event.preventDefault();
      if (currentLane > 0) currentLane--;
    } else if (event.key === 'ArrowRight' || event.code === 'ArrowRight') {
      // Move right
      event.preventDefault();
      if (currentLane < 2) currentLane++;
    }
  }
}, false);

// Add touchscreen support for mobile
document.addEventListener('touchstart', function(event) {
  if (!gameStarted) {
    startGame();
    event.preventDefault();
  }
});
