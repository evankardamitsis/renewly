// Create an audio context lazily to comply with browser autoplay policies
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
};

// Create a reverb effect
const createReverb = async (context: AudioContext) => {
    const convolver = context.createConvolver();
    const impulseLength = 1.5;
    const sampleRate = context.sampleRate;
    const impulse = context.createBuffer(2, impulseLength * sampleRate, sampleRate);
    
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
        const impulseData = impulse.getChannelData(channel);
        for (let i = 0; i < impulseData.length; i++) {
            impulseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impulseLength * sampleRate) * 3);
        }
    }
    
    convolver.buffer = impulse;
    return convolver;
};

// Create a single chime sound
const createChime = async (
    context: AudioContext,
    startTime: number,
    frequency: number,
) => {
    // Create two oscillators for a richer sound
    const sineOsc = context.createOscillator();
    const triangleOsc = context.createOscillator();
    
    // Create gain nodes for mixing
    const sineGain = context.createGain();
    const triangleGain = context.createGain();
    const mainGain = context.createGain();
    
    const reverb = await createReverb(context);
    const reverbGain = context.createGain();
    
    // Set up routing for both oscillators
    sineOsc.connect(sineGain);
    triangleOsc.connect(triangleGain);
    sineGain.connect(mainGain);
    triangleGain.connect(mainGain);
    
    // Main output routing
    mainGain.connect(context.destination); // dry path
    mainGain.connect(reverb); // wet path
    reverb.connect(reverbGain);
    reverbGain.connect(context.destination);

    // Configure the oscillators
    sineOsc.type = "sine";
    triangleOsc.type = "triangle";
    
    // Set frequencies
    sineOsc.frequency.setValueAtTime(frequency, startTime);
    triangleOsc.frequency.setValueAtTime(frequency, startTime);
    
    // Mix the oscillators
    sineGain.gain.setValueAtTime(0.8, startTime); // More sine for extra warmth
    triangleGain.gain.setValueAtTime(0.1, startTime); // Less triangle for subtle brightness
    
    // Main envelope
    mainGain.gain.setValueAtTime(0, startTime);
    mainGain.gain.linearRampToValueAtTime(0.15, startTime + 0.005);
    mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    
    // Set reverb mix
    reverbGain.gain.setValueAtTime(0.15, startTime);

    // Play both oscillators
    sineOsc.start(startTime);
    triangleOsc.start(startTime);
    sineOsc.stop(startTime + 0.2);
    triangleOsc.stop(startTime + 0.2);
};

// Create harmonies by playing multiple notes
const createHarmony = async (context: AudioContext, startTime: number, frequencies: number[]) => {
    await Promise.all(frequencies.map(freq => createChime(context, startTime, freq)));
};

// Create two chimes in succession
const createNotificationSound = async () => {
    const context = getAudioContext();
    const now = context.currentTime;

    // Create a harmonious sequence that follows the original progression
    // E5 -> G5 -> B5 -> C6 with added harmonies
    
    // First: E5 with its third (G5)
    await createHarmony(context, now, [659.25, 783.99]);         // E5 + G5
    
    // Second: G5 with its third (B5)
    await createHarmony(context, now + 0.08, [783.99, 987.77]);  // G5 + B5
    
    // Third: B5 with its third (D6)
    await createHarmony(context, now + 0.16, [987.77, 1174.66]); // B5 + D6
    
    // Final: C6 with its third (E6) for bright resolution
    await createHarmony(context, now + 0.24, [1046.50, 1318.51]); // C6 + E6
};

export const playNotificationSound = async () => {
    let context: AudioContext | null = null;
    try {
        context = getAudioContext();
        // Resume the audio context if it's suspended (browser autoplay policy)
        if (context.state === "suspended") {
            await context.resume();
        }
        await createNotificationSound();
    } catch (error) {
        console.error("Failed to play notification sound:", error);
        // Add detailed error logging
        if (context) {
            console.log("Audio Context State:", context.state);
            console.log("Audio Context Sample Rate:", context.sampleRate);
        }
    }
};
