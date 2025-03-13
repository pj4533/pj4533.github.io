/**
 * TextParticle class for creating animated text effects
 */
export class TextParticle {
  /**
   * Creates a new text particle
   * @param {string} text - The text to display
   * @param {THREE.Vector3} position - Initial position
   * @param {number} color - Color in hexadecimal format
   * @param {boolean} isRepoName - Whether this is a repository name (for special treatment)
   */
  constructor(text, position, color, isRepoName = false) {
    this.text = text;
    this.position = position.clone();
    this.initialY = position.y; // Store initial Y position to calculate relative height
    this.isRepoName = isRepoName;
    
    // Static variable to track the last direction used
    if (!TextParticle.lastDirection) {
      TextParticle.lastDirection = 0; // 0: left, 1: up, 2: right
    }
    
    // Get the next direction (different from the previous one)
    TextParticle.lastDirection = (TextParticle.lastDirection + 1) % 3;
    const direction = TextParticle.lastDirection;
    
    // Set velocity based on direction to avoid overlapping
    const baseSpeed = 0.05; // Increased base movement speed
    let xVelocity = 0;
    let yVelocity = 0;
    
    switch (direction) {
      case 0: // Left
        xVelocity = -baseSpeed * 0.8;
        yVelocity = baseSpeed * 1.2; // Increased upward velocity
        break;
      case 1: // Straight up
        xVelocity = 0;
        yVelocity = baseSpeed * 1.5; // Much higher upward velocity
        break;
      case 2: // Right
        xVelocity = baseSpeed * 0.8;
        yVelocity = baseSpeed * 1.2; // Increased upward velocity
        break;
    }
    
    this.velocity = new THREE.Vector3(
      xVelocity,
      yVelocity,
      (Math.random() - 0.5) * 0.01 // Minimal z-movement
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
    
    // Shorter lifetime for text particles
    this.life = 1.0;
    this.lifeSpeed = isRepoName ? 0.004 : 0.006; // Much faster fade for shorter display time
    
    // Short delay before fading starts
    this.delayFade = isRepoName ? 100 : 60; // Quick fade after reaching safe height
    
    this.createMesh();
  }

  /**
   * Creates the mesh for the text particle
   */
  createMesh() {
    try {
      // Create canvas for text with more width for longer text
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 2048; // Significantly increased width for longer text
      canvas.height = 1024;  // Significantly increased height for wrapped text
      
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
      
      // Implement text wrapping for long text without arbitrary limits
      const textLines = [];
      const maxLineWidth = this.isRepoName ? 1500 : 1600; // Maximum width in pixels
      
      // First, split by explicit newlines to respect formatting
      const explicitLines = safeText.split('\n');
      
      // Process each explicit line for width wrapping
      explicitLines.forEach(line => {
        // Measure the line width
        const lineMetrics = context.measureText(line);
        
        if (lineMetrics.width > maxLineWidth) {
          // Line needs wrapping
          const words = line.split(' ');
          let currentLine = '';
          
          // Process each word - no word limit
          words.forEach(word => {
            // Measure current line with this word added
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testMetrics = context.measureText(testLine);
            
            if (testMetrics.width > maxLineWidth) {
              // If adding this word exceeds max width, push current line
              if (currentLine) {
                textLines.push(currentLine);
                currentLine = word;
              } else {
                // Handle very long single words - use them as is
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
          // No wrapping needed for this line
          textLines.push(line);
        }
      });
      
      // Ensure we have at least one line
      if (textLines.length === 0) {
        textLines.push(safeText.split(' ')[0]);
      }
      
      // Add a descriptive label at the beginning if this is a repo name or profile item
      if (this.isRepoName) {
        // Determine the type of data from the first line and content patterns
        let dataTypeLabel = "";  // Default to empty string
        const firstLine = textLines[0] || "";
        
        // Check for profile data type from emoji
        if (firstLine.includes('👤')) dataTypeLabel = "GITHUB PROFILE";
        else if (firstLine.includes('📍')) dataTypeLabel = "LOCATION";
        else if (firstLine.includes('📊')) dataTypeLabel = "GITHUB STATISTICS";
        else if (firstLine.includes('💻')) dataTypeLabel = "PROGRAMMING LANGUAGES";
        else if (firstLine.includes('⭐')) dataTypeLabel = "FEATURED REPOSITORY";
        else if (firstLine.includes('🏢')) dataTypeLabel = "EMPLOYMENT";
        else if (firstLine.includes('💼')) dataTypeLabel = "JOB DETAILS";
        else if (firstLine.includes('🔧')) dataTypeLabel = "TECHNICAL SKILLS";
        else if (firstLine.includes('🎓')) dataTypeLabel = "EDUCATION";
        else if (firstLine.includes('🏆')) dataTypeLabel = "AWARD";
        // Check if this is a fact collectible
        else if (this.text && this.text.startsWith("Fact\n")) {
          dataTypeLabel = "FACT";
        }
        // Special detection for GitHub repositories - any of these characteristics identify a repo:
        // 1. Name is all uppercase (GitHub repos are formatted this way in the game)
        // 2. Contains language tag in square brackets like [JavaScript]
        // 3. Contains star count with star emoji (★)
        else if (
          // Check if the first line is all uppercase (how repos are formatted)
          firstLine === firstLine.toUpperCase() && 
          firstLine.length > 0 &&
          // Additional checks to avoid false positives on other uppercase text
          (
            // Has language tag [JavaScript] format
            firstLine.includes('[') && firstLine.includes(']') ||
            // Has star count
            firstLine.includes('★') ||
            // Has multiple lines including a description (typical repo format)
            (textLines.length > 1 && !firstLine.includes('«') && !firstLine.includes('»'))
          )
        ) {
          // Only assign "GITHUB REPOSITORY" label if we have strong confidence this is a GitHub repo
          // If we're uncertain, leave dataTypeLabel empty
          if (firstLine.includes('[') && firstLine.includes(']') || firstLine.includes('★')) {
            dataTypeLabel = "GITHUB REPOSITORY";
          }
        }
        
        // Only add the label if it's not empty
        if (dataTypeLabel) {
          textLines.unshift(`« ${dataTypeLabel} »`);
        }
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
        
        // Make the background larger to fit longer text and the header label
        const padding = 100; // More horizontal padding for descriptive label
        
        // First draw outer glow border
        context.fillStyle = `#${hexColor}33`; // Semi-transparent color matching the text
        context.fillRect(
          canvas.width/2 - textWidth/2 - (padding/2),
          canvas.height/2 - textHeight/2 - 20,
          textWidth + padding,
          textHeight + 40
        );
        
        // Then draw solid black background
        context.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Darker background
        context.fillRect(
          canvas.width/2 - textWidth/2 - (padding/2) + 4,
          canvas.height/2 - textHeight/2 - 16,
          textWidth + padding - 8, 
          textHeight + 32
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
        
        // Special styling for the header label (if present)
        if (line.includes('«') && line.includes('»')) {
          // Save current context to restore after
          context.save();
          
          // Smaller, bolder font for the header label
          context.font = `900 ${fontSize * 0.75}px "JetBrains Mono", monospace`;
          
          // Create a more distinctive fill for the header
          const labelGradient = context.createLinearGradient(0, lineY-20, canvas.width, lineY+20);
          labelGradient.addColorStop(0, '#ffffff');
          labelGradient.addColorStop(0.5, `#${hexColor}`);
          labelGradient.addColorStop(1, '#ffffff');
          context.fillStyle = labelGradient;
          
          // Draw the header label
          context.strokeText(line, textX, lineY);
          context.fillText(line, textX, lineY);
          
          // Restore the context for remaining lines
          context.restore();
        } else {
          // Draw normal text (first stroke for outline, then fill)
          context.strokeText(line, textX, lineY);
          context.fillText(line, textX, lineY);
        }
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
      
      // Use actual textLines length for most accurate height calculation
      const lineCount = textLines.length;
      
      // Base height on actual number of text lines
      const planeHeight = lineCount <= 1 ? 1.5 : 1.5 + ((lineCount - 1) * 0.5);
      
      // Create plane geometry for the text
      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      
      // Create mesh with geometry and material
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.copy(this.position);
      this.mesh.scale.set(this.scale, this.scale, this.scale);
      
      // Add the repo-text class
      this.mesh.userData.className = 'repo-text';
      
      // Make sure camera exists before looking at it
      if (window.camera) {
        // Always face the camera (billboard effect)
        this.mesh.lookAt(window.camera.position);
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
  
  /**
   * Updates the particle's position, rotation, and opacity
   * @returns {boolean} - Whether the particle is still "alive"
   */
  update() {
    try {
      if (!this.mesh) {
        console.error('Missing mesh in TextParticle update');
        return false; // Return false to remove this particle
      }
      
      // Define a safe height threshold (relative to initial position)
      const safeHeightThreshold = 2.5;
      
      // Slow down movement once text has reached a safe height
      if (this.position.y - this.initialY > safeHeightThreshold) {
        // Reduce velocity once at safe height
        this.velocity.x *= 0.95;
        this.velocity.y *= 0.80; // Slow down vertical movement more
        
        // Add downward angle to velocity as text rises above the road
        if (this.velocity.y > -0.05) { // Allow it to go negative for strong downward angle
          this.velocity.y -= 0.002; // Very subtle downward angle
        }
      }
      
      // Update position with directional movement
      this.position.add(this.velocity);
      this.mesh.position.copy(this.position);
      
      // Slight rotation for subtle motion but not too much to make it hard to read
      this.rotation.x += this.rotationSpeed.x;
      this.rotation.y += this.rotationSpeed.y;
      this.rotation.z += this.rotationSpeed.z;
      
      // Always look at camera first (billboard effect) if camera exists
      if (window.camera) {
        try {
          this.mesh.lookAt(window.camera.position);
          // Apply only Z rotation to keep text oriented correctly
          this.mesh.rotateZ(this.rotation.z * 0.3);
        } catch (e) {
          console.error('Error rotating text:', e);
        }
      }
      
      // Check if we've reached safe height to trigger receding effect
      const atSafeHeight = this.position.y - this.initialY > 2.5;
      
      // Delayed recession effect - start receding if at safe height
      if (this.delayFade > 0) {
        // If at safe height, reduce delay more quickly to start receding sooner
        this.delayFade -= atSafeHeight ? 3 : 1;
      } else {
        // Accelerate life decrease once at safe height (controls how quickly text recedes)
        const lifeDecreaseMultiplier = atSafeHeight ? 1.5 : 1.0;
        this.life -= this.lifeSpeed * lifeDecreaseMultiplier;
        
        // Only fade at the very end of life (last 10%)
        if (this.life < 0.1) {
          // Quick fade at the very end
          this.opacity = this.life * 10; // Map 0.1-0 to 1-0
        } else {
          // Otherwise maintain full opacity while receding
          this.opacity = 1.0;
        }
        
        if (this.mesh.material) {
          this.mesh.material.opacity = this.opacity;
        }
      }
      
      // Apply scale and movement effects based on fade state
      let scaleFactor;
      
      // If we're receding (past the delay period)
      if (this.delayFade <= 0) {
        // Calculate recession progress
        const recessProgress = 1 - this.life; // 0 to 1 as text recedes
        
        // Gradually reduce scale more dramatically as text recedes
        scaleFactor = 1 - recessProgress * 0.7; // Shrink by up to 70%
        
        // Move text backward in z-space (away from camera) at an accelerating rate
        // Use quadratic easing for accelerating backward movement
        const zMovement = recessProgress * recessProgress * 0.15; // Accelerating backward movement
        this.mesh.position.z -= zMovement;
      } else {
        // Before recession starts, maintain normal scale
        scaleFactor = 1;
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