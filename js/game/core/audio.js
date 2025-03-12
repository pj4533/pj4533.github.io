/**
 * Audio module for NEON WAVE game
 * Creates synthesized 8-bit style synthwave music
 */

// Audio context and nodes
let audioContext;
let masterGainNode;

// Music state
let musicEnabled = true;
let isPlaying = false;
let currentPattern = 0;
let patternTimeoutId;
let nextNoteTime = 0;
let scheduleAheadTime = 0.1; // How far ahead to schedule audio (seconds)
let noteLength = 0.15; // Length of "beep" (in seconds)
let noteSpacing = 0.05; // Additional space between notes (in seconds)
let timeoutId;

// Synth parameters
const bpm = 120; // Tempo in beats per minute
const secondsPerBeat = 60.0 / bpm;

// Track components
let bassOscillators = [];
let melodyOscillators = [];
let arpeggioOscillators = [];
let kickOscillators = [];
let snareOscillators = [];
let hihatOscillators = [];

// Synthwave scales and chords
const minorScale = [0, 2, 3, 5, 7, 8, 10, 12]; // Minor scale (A minor)
const bassNotes = [45, 45, 50, 52]; // A, A, D, E
const chordProgression = [
  [45, 49, 52], // A minor (A, C, E)
  [45, 48, 52], // A sus2 (A, B, E)
  [50, 54, 57], // D minor (D, F, A)
  [52, 56, 59]  // E minor (E, G, B)
];

// Melodies - emulates classic synthwave arpeggios
const melodyPatterns = [
  [9, 7, 4, 0, 4, 7],
  [7, 4, 0, 4, 7, 11],
  [9, 7, 3, 0, 3, 7],
  [7, 4, 0, 4, 7, 7]
];

// Init function - creates the audio context and sets up the tracks
export function initAudio() {
  try {
    // Create audio context with fallback for older browsers
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    
    // Create master gain node (volume control)
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 0.6; // Set overall volume
    masterGainNode.connect(audioContext.destination);
    
    // Resume AudioContext if it's suspended (needed for Chrome's autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    console.log('Audio system initialized');
    return true;
  } catch (e) {
    console.error('Audio system could not be initialized:', e);
    return false;
  }
}

// Toggle music on/off
export function toggleMusic() {
  musicEnabled = !musicEnabled;
  
  if (musicEnabled) {
    if (!isPlaying) {
      startMusic();
    }
  } else {
    if (isPlaying) {
      stopMusic();
    }
  }
  
  return musicEnabled;
}

// Start playing the music
export function startMusic() {
  if (!audioContext) {
    const success = initAudio();
    if (!success) return false;
  }
  
  // If context is suspended, resume it
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  if (!isPlaying) {
    isPlaying = true;
    nextNoteTime = audioContext.currentTime;
    scheduleNotes();
    console.log('Music started');
  }
  
  return true;
}

// Stop the music
export function stopMusic() {
  isPlaying = false;
  
  // Clear any timeouts
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  if (patternTimeoutId) {
    clearTimeout(patternTimeoutId);
  }
  
  // Stop all oscillators
  stopAllOscillators();
  
  console.log('Music stopped');
  return true;
}

// Schedule the next set of notes
function scheduleNotes() {
  // If not playing, don't schedule more notes
  if (!isPlaying) return;
  
  // Schedule multiple patterns ahead
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    playPattern(nextNoteTime);
    advanceNote();
  }
  
  // Schedule next check
  timeoutId = setTimeout(scheduleNotes, 25);
}

// Advance to the next note position
function advanceNote() {
  // 4/4 time, 4 beats per pattern
  nextNoteTime += secondsPerBeat * 4;
  
  // Move to next pattern
  currentPattern = (currentPattern + 1) % chordProgression.length;
}

// Play a pattern at the scheduled time
function playPattern(time) {
  const patternIndex = currentPattern;
  const chordIndex = patternIndex % chordProgression.length;
  
  // Play bass note
  playBassNote(bassNotes[chordIndex], time, secondsPerBeat * 4);
  
  // Play chord arpeggio
  playArpeggios(chordProgression[chordIndex], time, patternIndex);
  
  // Play melody pattern
  playMelody(chordProgression[chordIndex], melodyPatterns[patternIndex % melodyPatterns.length], time);
  
  // Play drums
  playDrums(time);
}

// Play a bass note
function playBassNote(note, time, duration) {
  // Create oscillator for bass
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Set up oscillator
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = midiToFrequency(note);
  
  // Apply envelope
  gainNode.gain.setValueAtTime(0.5, time);
  gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.1);
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(masterGainNode);
  
  // Start and stop
  oscillator.start(time);
  oscillator.stop(time + duration);
  
  // Add to tracking array to clean up later
  bassOscillators.push({oscillator, gainNode});
  
  // Clean up
  oscillator.onended = function() {
    gainNode.disconnect();
    const index = bassOscillators.findIndex(o => o.oscillator === oscillator);
    if (index >= 0) {
      bassOscillators.splice(index, 1);
    }
  };
}

// Play arpeggiated chord
function playArpeggios(chord, time, patternIndex) {
  const noteDuration = secondsPerBeat / 2; // Eighth notes
  
  // Different arpeggio patterns based on current pattern
  const arpPattern = patternIndex % 2 === 0 ? 
    [0, 1, 2, 1, 0, 1, 2, 2] : 
    [2, 1, 0, 1, 2, 1, 0, 0];
  
  // Play each note in the arpeggio
  for (let i = 0; i < 8; i++) {
    const noteTime = time + (noteDuration * i);
    const note = chord[arpPattern[i]];
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set up oscillator
    oscillator.type = 'square';
    oscillator.frequency.value = midiToFrequency(note);
    
    // Apply envelope
    gainNode.gain.setValueAtTime(0.0, noteTime);
    gainNode.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration - 0.05);
    
    // Add slight detune for width
    oscillator.detune.value = Math.random() * 10 - 5;
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(masterGainNode);
    
    // Start and stop
    oscillator.start(noteTime);
    oscillator.stop(noteTime + noteDuration);
    
    // Add to tracking array
    arpeggioOscillators.push({oscillator, gainNode});
    
    // Clean up
    oscillator.onended = function() {
      gainNode.disconnect();
      const index = arpeggioOscillators.findIndex(o => o.oscillator === oscillator);
      if (index >= 0) {
        arpeggioOscillators.splice(index, 1);
      }
    };
  }
}

// Play melody
function playMelody(chord, pattern, time) {
  const noteDuration = secondsPerBeat / 2; // Eighth notes
  const root = chord[0];
  
  // Play each note of the melody pattern
  for (let i = 0; i < pattern.length; i++) {
    const noteTime = time + (noteDuration * i);
    // Transpose pattern to chord root
    const note = root + pattern[i];
    
    // Skip some notes randomly for variation
    if (Math.random() < 0.2) continue;
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set up oscillator - use pulse wave for 8-bit feel
    oscillator.type = 'square';
    oscillator.frequency.value = midiToFrequency(note);
    
    // Apply envelope
    gainNode.gain.setValueAtTime(0.0, noteTime);
    gainNode.gain.linearRampToValueAtTime(0.15, noteTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration - 0.02);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(masterGainNode);
    
    // Start and stop
    oscillator.start(noteTime);
    oscillator.stop(noteTime + noteDuration);
    
    // Add to tracking array
    melodyOscillators.push({oscillator, gainNode});
    
    // Clean up
    oscillator.onended = function() {
      gainNode.disconnect();
      const index = melodyOscillators.findIndex(o => o.oscillator === oscillator);
      if (index >= 0) {
        melodyOscillators.splice(index, 1);
      }
    };
  }
}

// Play drum pattern
function playDrums(time) {
  // 4/4 time, 16 steps
  const steps = 16;
  const stepTime = secondsPerBeat / 4; // Sixteenth notes
  
  // Drum patterns (1 = play, 0 = silent)
  const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  const snarePattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
  const hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
  
  // Play each step
  for (let i = 0; i < steps; i++) {
    const stepStartTime = time + (i * stepTime);
    
    // Kick drum
    if (kickPattern[i]) {
      playKick(stepStartTime);
    }
    
    // Snare drum
    if (snarePattern[i]) {
      playSnare(stepStartTime);
    }
    
    // Hi-hat
    if (hihatPattern[i]) {
      playHihat(stepStartTime);
    }
  }
}

// Play kick drum sound
function playKick(time) {
  // Create oscillator and gain
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Set up oscillator for kick
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(120, time);
  oscillator.frequency.exponentialRampToValueAtTime(55, time + 0.1);
  
  // Set envelope
  gainNode.gain.setValueAtTime(0.8, time);
  gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(masterGainNode);
  
  // Start and stop
  oscillator.start(time);
  oscillator.stop(time + 0.2);
  
  // Add to tracking array
  kickOscillators.push({oscillator, gainNode});
  
  // Clean up
  oscillator.onended = function() {
    gainNode.disconnect();
    const index = kickOscillators.findIndex(o => o.oscillator === oscillator);
    if (index >= 0) {
      kickOscillators.splice(index, 1);
    }
  };
}

// Play snare drum sound
function playSnare(time) {
  // Create noise for snare
  const bufferSize = audioContext.sampleRate * 0.1; // 100ms
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Fill buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  // Create noise source
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  // Create bandpass filter
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  filter.Q.value = 1.5;
  
  // Create gain node
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.3, time);
  gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
  
  // Connect nodes
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(masterGainNode);
  
  // Start and stop
  noise.start(time);
  noise.stop(time + 0.1);
  
  // Add to tracking array
  snareOscillators.push({oscillator: noise, gainNode});
  
  // Clean up
  noise.onended = function() {
    gainNode.disconnect();
    filter.disconnect();
    const index = snareOscillators.findIndex(o => o.oscillator === noise);
    if (index >= 0) {
      snareOscillators.splice(index, 1);
    }
  };
}

// Play hi-hat sound
function playHihat(time) {
  // Create noise for hi-hat
  const bufferSize = audioContext.sampleRate * 0.05; // 50ms
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Fill buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  // Create noise source
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  // Create highpass filter
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  
  // Create gain node
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.1, time);
  gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
  
  // Connect nodes
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(masterGainNode);
  
  // Start and stop
  noise.start(time);
  noise.stop(time + 0.05);
  
  // Add to tracking array
  hihatOscillators.push({oscillator: noise, gainNode});
  
  // Clean up
  noise.onended = function() {
    gainNode.disconnect();
    filter.disconnect();
    const index = hihatOscillators.findIndex(o => o.oscillator === noise);
    if (index >= 0) {
      hihatOscillators.splice(index, 1);
    }
  };
}

// Stop all oscillators (used when stopping music)
function stopAllOscillators() {
  const allOscillators = [
    ...bassOscillators,
    ...melodyOscillators,
    ...arpeggioOscillators,
    ...kickOscillators,
    ...snareOscillators,
    ...hihatOscillators
  ];
  
  const now = audioContext.currentTime;
  
  // Stop all oscillators
  allOscillators.forEach(({oscillator, gainNode}) => {
    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      oscillator.stop(now + 0.1);
    } catch (e) {
      // Ignore errors on oscillators that might already be stopped
    }
  });
  
  // Clear arrays
  bassOscillators = [];
  melodyOscillators = [];
  arpeggioOscillators = [];
  kickOscillators = [];
  snareOscillators = [];
  hihatOscillators = [];
}

// Set music volume
export function setMusicVolume(volume) {
  if (!masterGainNode) return false;
  
  // Clamp volume between 0 and 1
  const clampedVolume = Math.max(0, Math.min(1, volume));
  masterGainNode.gain.value = clampedVolume;
  
  return true;
}

// Utility: Convert MIDI note to frequency
function midiToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}