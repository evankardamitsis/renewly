// Create an audio context lazily to comply with browser autoplay policies
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
};

// Create a single chime sound
const createChime = (
    context: AudioContext,
    startTime: number,
    frequency: number,
) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Configure the chime with a warmer sound
    oscillator.type = "sine"; // Warmer than triangle
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    // Play the chime
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.25);
};

// Create two chimes in succession
const createNotificationSound = async () => {
    const context = getAudioContext();
    const now = context.currentTime;

    // First chime (G4 note)
    createChime(context, now, 392.00);
    // Second chime (C4 note) - perfect fourth interval
    createChime(context, now + 0.08, 261.63);
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
