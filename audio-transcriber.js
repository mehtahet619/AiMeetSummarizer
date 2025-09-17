// Real-time audio transcription using Web Speech API
class AudioTranscriber {
  constructor(onTranscriptUpdate, onError) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onError = onError;
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.finalTranscript = '';
    this.restartTimeout = null;
    this.silenceTimeout = null;
    
    this.initializeSpeechRecognition();
  }

  initializeSpeechRecognition() {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.onError('Speech recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected, continuing...');
          break;
        case 'audio-capture':
          this.onError('Microphone access denied or not available');
          break;
        case 'not-allowed':
          this.onError('Microphone permission denied');
          break;
        case 'network':
          this.onError('Network error during speech recognition');
          break;
        default:
          console.log(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      
      // Auto-restart if we're supposed to be listening
      if (this.shouldRestart) {
        this.restartTimeout = setTimeout(() => {
          this.startListening();
        }, 1000);
      }
    };
  }

  handleSpeechResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    // Process all results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Update transcripts
    if (finalTranscript) {
      this.finalTranscript += finalTranscript;
      this.transcript = this.finalTranscript;
      
      // Add timestamp
      const timestamp = new Date().toLocaleTimeString();
      const timestampedText = `[${timestamp}] ${finalTranscript.trim()}\n`;
      
      // Notify listeners with final transcript
      this.onTranscriptUpdate({
        type: 'final',
        text: timestampedText,
        fullTranscript: this.transcript
      });
    }

    if (interimTranscript) {
      this.interimTranscript = interimTranscript;
      
      // Notify listeners with interim results
      this.onTranscriptUpdate({
        type: 'interim',
        text: interimTranscript,
        fullTranscript: this.transcript + interimTranscript
      });
    }

    // Reset silence timeout
    this.resetSilenceTimeout();
  }

  resetSilenceTimeout() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    
    // Restart recognition after 30 seconds of silence
    this.silenceTimeout = setTimeout(() => {
      if (this.isListening) {
        console.log('Restarting due to silence');
        this.restart();
      }
    }, 30000);
  }

  async startListening() {
    if (!this.recognition) {
      this.onError('Speech recognition not initialized');
      return false;
    }

    if (this.isListening) {
      console.log('Already listening');
      return true;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      
      this.shouldRestart = true;
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.onError('Failed to access microphone: ' + error.message);
      return false;
    }
  }

  stopListening() {
    this.shouldRestart = false;
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  restart() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      // onend handler will restart automatically
    }
  }

  getFullTranscript() {
    return this.transcript;
  }

  clearTranscript() {
    this.transcript = '';
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  isSupported() {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioTranscriber;
} else if (typeof window !== 'undefined') {
  window.AudioTranscriber = AudioTranscriber;
}