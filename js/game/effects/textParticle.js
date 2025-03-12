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
    this.isRepoName = isRepoName;
    
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
        
        // Make the background larger to fit longer text
        const padding = 80; // More horizontal padding
        
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
      
      // Update position with gentle movement
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