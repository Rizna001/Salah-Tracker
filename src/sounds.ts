let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Play a gentle chime sound for prayer completion
export function playPrayerCompleteSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create a pleasant two-tone chime
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now);
      
      gainNode.gain.setValueAtTime(0, now + i * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);
      
      oscillator.start(now + i * 0.15);
      oscillator.stop(now + i * 0.15 + 0.8);
    });
  } catch (e) {
    console.log('Audio not available:', e);
  }
}

// Play a celebratory sound when goal is achieved
export function playGoalAchievedSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Celebratory ascending melody
    const melody = [
      { freq: 523.25, time: 0, duration: 0.2 },     // C5
      { freq: 587.33, time: 0.15, duration: 0.2 },   // D5
      { freq: 659.25, time: 0.3, duration: 0.2 },    // E5
      { freq: 783.99, time: 0.45, duration: 0.2 },   // G5
      { freq: 1046.5, time: 0.6, duration: 0.5 },    // C6 - hold
    ];

    melody.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + time);
      
      gainNode.gain.setValueAtTime(0, now + time);
      gainNode.gain.linearRampToValueAtTime(0.2, now + time + 0.03);
      gainNode.gain.setValueAtTime(0.2, now + time + duration * 0.6);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + time + duration);
      
      oscillator.start(now + time);
      oscillator.stop(now + time + duration);
    });

    // Add a shimmer effect
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1568, now + 0.6);
    shimmer.frequency.exponentialRampToValueAtTime(2093, now + 1.2);
    shimmerGain.gain.setValueAtTime(0, now + 0.6);
    shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.7);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    shimmer.start(now + 0.6);
    shimmer.stop(now + 1.3);
  } catch (e) {
    console.log('Audio not available:', e);
  }
}

// Play a gentle adhan-like notification sound
export function playPrayerReminderSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Gentle melodic notification reminiscent of adhan
    const notes = [
      { freq: 440, time: 0, duration: 0.6 },      // A4
      { freq: 493.88, time: 0.5, duration: 0.4 },  // B4
      { freq: 523.25, time: 0.8, duration: 0.6 },  // C5
      { freq: 493.88, time: 1.3, duration: 0.4 },  // B4
      { freq: 440, time: 1.6, duration: 0.8 },     // A4 - hold
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + time);
      
      gainNode.gain.setValueAtTime(0, now + time);
      gainNode.gain.linearRampToValueAtTime(0.18, now + time + 0.08);
      gainNode.gain.setValueAtTime(0.18, now + time + duration * 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + time + duration);
      
      oscillator.start(now + time);
      oscillator.stop(now + time + duration + 0.1);
    });
  } catch (e) {
    console.log('Audio not available:', e);
  }
}

// Play a soft click sound for UI interactions
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch (e) {
    console.log('Audio not available:', e);
  }
}
