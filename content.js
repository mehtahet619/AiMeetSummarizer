// Content script for detecting meeting events and extracting transcripts
class MeetingDetector {
  constructor() {
    this.platform = this.detectPlatform();
    this.isInMeeting = false;
    this.transcript = '';
    this.meetingTitle = '';
    this.observers = [];
    this.audioTranscriber = null;
    this.transcriptDisplay = null;
    this.isRealTimeEnabled = true;
    
    this.init();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('meet.google.com')) return 'google-meet';
    if (hostname.includes('zoom.us')) return 'zoom';
    if (hostname.includes('teams.microsoft.com')) return 'teams';
    return 'unknown';
  }

  init() {
    console.log(`Meeting Summarizer: Detected platform - ${this.platform}`);
    
    // Wait for page to load completely
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupDetection());
    } else {
      this.setupDetection();
    }
  }

  setupDetection() {
    switch (this.platform) {
      case 'google-meet':
        this.setupGoogleMeetDetection();
        break;
      case 'zoom':
        this.setupZoomDetection();
        break;
      case 'teams':
        this.setupTeamsDetection();
        break;
    }
  }

  setupGoogleMeetDetection() {
    // Detect meeting start/end by monitoring URL and UI elements
    this.observeUrlChanges();
    
    // Monitor for captions/transcript
    this.observeTranscript();
    
    // Monitor for meeting end indicators
    this.observeMeetingEnd();
  }

  setupZoomDetection() {
    // Similar setup for Zoom
    this.observeUrlChanges();
    this.observeTranscript();
    this.observeMeetingEnd();
  }

  setupTeamsDetection() {
    // Similar setup for Teams
    this.observeUrlChanges();
    this.observeTranscript();
    this.observeMeetingEnd();
  }

  observeUrlChanges() {
    let currentUrl = window.location.href;
    
    const checkUrl = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.handleUrlChange();
      }
    };
    
    setInterval(checkUrl, 1000);
  }

  handleUrlChange() {
    const inMeeting = this.checkIfInMeeting();
    
    if (inMeeting && !this.isInMeeting) {
      this.onMeetingStart();
    } else if (!inMeeting && this.isInMeeting) {
      this.onMeetingEnd();
    }
  }

  checkIfInMeeting() {
    switch (this.platform) {
      case 'google-meet':
        return window.location.pathname.includes('/') && 
               window.location.pathname.length > 1 &&
               !window.location.pathname.includes('/landing');
      case 'zoom':
        return window.location.pathname.includes('/wc/') ||
               document.querySelector('[data-testid="meeting-window"]') !== null;
      case 'teams':
        return window.location.pathname.includes('/meetup-join/') ||
               document.querySelector('[data-tid="meeting-stage"]') !== null;
      default:
        return false;
    }
  }

  onMeetingStart() {
    console.log('Meeting started');
    this.isInMeeting = true;
    this.transcript = '';
    this.meetingTitle = this.extractMeetingTitle();
    
    // Create real-time transcript display
    this.createTranscriptDisplay();
    
    // Start real-time audio transcription
    this.startRealTimeTranscription();
    
    // Also start monitoring for existing transcript (fallback)
    this.startTranscriptCapture();
  }

  onMeetingEnd() {
    console.log('Meeting ended');
    this.isInMeeting = false;
    
    // Stop real-time transcription
    this.stopRealTimeTranscription();
    
    // Hide transcript display
    this.hideTranscriptDisplay();
    
    // Process the collected transcript
    if (this.transcript.trim().length > 0) {
      this.processMeetingTranscript();
    } else {
      this.showNotification('Meeting ended but no transcript was captured');
    }
    
    this.cleanup();
  }

  extractMeetingTitle() {
    switch (this.platform) {
      case 'google-meet':
        const titleElement = document.querySelector('[data-meeting-title]') ||
                           document.querySelector('title');
        return titleElement ? titleElement.textContent.trim() : 'Google Meet';
      
      case 'zoom':
        const zoomTitle = document.querySelector('[data-testid="meeting-title"]') ||
                         document.querySelector('title');
        return zoomTitle ? zoomTitle.textContent.trim() : 'Zoom Meeting';
      
      case 'teams':
        const teamsTitle = document.querySelector('[data-tid="meeting-title"]') ||
                          document.querySelector('title');
        return teamsTitle ? teamsTitle.textContent.trim() : 'Teams Meeting';
      
      default:
        return 'Meeting';
    }
  }

  startTranscriptCapture() {
    // Set up observers for transcript elements
    this.observeTranscript();
  }

  observeTranscript() {
    const transcriptSelectors = this.getTranscriptSelectors();
    
    transcriptSelectors.forEach(selector => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                this.extractTranscriptText(node);
              }
            });
          }
        });
      });

      // Start observing
      const targetElement = document.querySelector(selector);
      if (targetElement) {
        observer.observe(targetElement, {
          childList: true,
          subtree: true,
          characterData: true
        });
        this.observers.push(observer);
      }
    });

    // Also capture existing transcript text
    this.captureExistingTranscript();
  }

  getTranscriptSelectors() {
    switch (this.platform) {
      case 'google-meet':
        return [
          '[data-captions-container]',
          '[jsname="dsyhDe"]', // Captions container
          '.a4cQT', // Another captions selector
          '[data-self-name] ~ div' // Chat/transcript area
        ];
      
      case 'zoom':
        return [
          '[data-testid="live-transcription"]',
          '.live-transcription-container',
          '.closed-caption-container'
        ];
      
      case 'teams':
        return [
          '[data-tid="live-captions"]',
          '.live-captions-container',
          '[data-tid="transcript-content"]'
        ];
      
      default:
        return [];
    }
  }

  captureExistingTranscript() {
    const selectors = this.getTranscriptSelectors();
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent.trim();
        if (text && text.length > 10) { // Avoid capturing noise
          this.addToTranscript(text);
        }
      });
    });
  }

  extractTranscriptText(node) {
    let text = '';
    
    if (node.nodeType === Node.TEXT_NODE) {
      text = node.textContent.trim();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      text = node.textContent.trim();
    }
    
    if (text && text.length > 5 && !this.isDuplicateText(text)) {
      this.addToTranscript(text);
    }
  }

  isDuplicateText(text) {
    // Simple duplicate detection
    const lastLines = this.transcript.split('\n').slice(-5);
    return lastLines.some(line => line.includes(text) || text.includes(line));
  }

  addToTranscript(text) {
    const timestamp = new Date().toLocaleTimeString();
    this.transcript += `[${timestamp}] ${text}\n`;
  }

  observeMeetingEnd() {
    // Monitor for meeting end indicators
    const endSelectors = this.getMeetingEndSelectors();
    
    endSelectors.forEach(selector => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const endElement = node.querySelector && node.querySelector(selector);
              if (endElement || node.matches && node.matches(selector)) {
                setTimeout(() => this.onMeetingEnd(), 2000); // Delay to capture final transcript
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      this.observers.push(observer);
    });
  }

  getMeetingEndSelectors() {
    switch (this.platform) {
      case 'google-meet':
        return [
          '[data-call-ended]',
          'button[aria-label*="Leave call"]',
          '.VfPpkd-Bz112c-LgbsSe[aria-label*="Leave"]'
        ];
      
      case 'zoom':
        return [
          '[data-testid="leave-meeting"]',
          '.leave-meeting-button',
          '[aria-label*="Leave Meeting"]'
        ];
      
      case 'teams':
        return [
          '[data-tid="call-end"]',
          'button[aria-label*="Leave"]',
          '[data-tid="hangup-button"]'
        ];
      
      default:
        return [];
    }
  }

  processMeetingTranscript() {
    console.log('Processing meeting transcript...');
    
    // Send final transcript update
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPT_UPDATE',
      data: {
        transcript: this.transcript,
        meetingTitle: this.meetingTitle,
        isComplete: true
      }
    }, (response) => {
      if (response && response.success) {
        console.log('Meeting processed successfully');
        this.showNotification('Meeting summary generated! 📝');
      } else {
        console.error('Failed to process meeting:', response?.error);
        this.showNotification('Meeting ended - transcript saved');
      }
    });
  }

  showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  startRealTimeTranscription() {
    if (!this.isRealTimeEnabled) return;
    
    // Load the audio transcriber
    this.loadAudioTranscriber().then(() => {
      if (window.AudioTranscriber) {
        this.audioTranscriber = new window.AudioTranscriber(
          (data) => this.handleTranscriptUpdate(data),
          (error) => this.handleTranscriptionError(error)
        );
        
        // Start listening
        this.audioTranscriber.startListening().then(success => {
          if (success) {
            this.showNotification('🎤 Real-time transcription started');
            this.updateTranscriptDisplay('🎤 Listening for audio...');
          } else {
            this.showNotification('Failed to start audio transcription');
          }
        });
      }
    });
  }

  async loadAudioTranscriber() {
    return new Promise((resolve) => {
      if (window.AudioTranscriber) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('audio-transcriber.js');
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  handleTranscriptUpdate(data) {
    const { type, text, fullTranscript } = data;
    
    if (type === 'final') {
      // Add to permanent transcript
      this.transcript += text;
      this.updateTranscriptDisplay(fullTranscript, false);
      
      // Send update to background script
      chrome.runtime.sendMessage({
        type: 'TRANSCRIPT_UPDATE',
        data: {
          transcript: this.transcript,
          meetingTitle: this.meetingTitle,
          isComplete: false
        }
      });
    } else if (type === 'interim') {
      // Show interim results
      this.updateTranscriptDisplay(fullTranscript, true);
    }
  }

  handleTranscriptionError(error) {
    console.error('Transcription error:', error);
    this.showNotification(`Transcription error: ${error}`);
    
    // Fall back to platform transcript capture
    this.isRealTimeEnabled = false;
  }

  stopRealTimeTranscription() {
    if (this.audioTranscriber) {
      this.audioTranscriber.stopListening();
      this.audioTranscriber = null;
    }
  }

  createTranscriptDisplay() {
    // Create floating transcript display
    this.transcriptDisplay = document.createElement('div');
    this.transcriptDisplay.id = 'meeting-summarizer-transcript';
    this.transcriptDisplay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.4;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Add header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      font-weight: bold;
      font-size: 14px;
    `;
    header.innerHTML = `
      <span>🎤 Live Transcript</span>
      <button id="transcript-toggle" style="
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
      ">Hide</button>
    `;
    
    // Add content area
    const content = document.createElement('div');
    content.id = 'transcript-content';
    content.style.cssText = `
      white-space: pre-wrap;
      word-wrap: break-word;
    `;
    
    this.transcriptDisplay.appendChild(header);
    this.transcriptDisplay.appendChild(content);
    document.body.appendChild(this.transcriptDisplay);
    
    // Add toggle functionality
    document.getElementById('transcript-toggle').addEventListener('click', () => {
      this.toggleTranscriptDisplay();
    });
  }

  updateTranscriptDisplay(text, isInterim = false) {
    if (!this.transcriptDisplay) return;
    
    const content = document.getElementById('transcript-content');
    if (!content) return;
    
    if (isInterim) {
      // Show interim results in a different style
      const lines = text.split('\n');
      const finalLines = lines.slice(0, -1);
      const interimLine = lines[lines.length - 1];
      
      content.innerHTML = finalLines.join('\n') + 
        (interimLine ? `\n<span style="color: #888; font-style: italic;">${interimLine}</span>` : '');
    } else {
      content.textContent = text;
    }
    
    // Auto-scroll to bottom
    content.scrollTop = content.scrollHeight;
  }

  toggleTranscriptDisplay() {
    if (!this.transcriptDisplay) return;
    
    const content = document.getElementById('transcript-content');
    const button = document.getElementById('transcript-toggle');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      button.textContent = 'Hide';
    } else {
      content.style.display = 'none';
      button.textContent = 'Show';
    }
  }

  hideTranscriptDisplay() {
    if (this.transcriptDisplay && this.transcriptDisplay.parentNode) {
      this.transcriptDisplay.parentNode.removeChild(this.transcriptDisplay);
      this.transcriptDisplay = null;
    }
  }

  cleanup() {
    // Stop real-time transcription
    this.stopRealTimeTranscription();
    
    // Hide transcript display
    this.hideTranscriptDisplay();
    
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_REAL_TIME_TRANSCRIPTION':
      if (meetingDetector) {
        meetingDetector.startRealTimeTranscription();
        sendResponse({ success: true });
      } else {
        sendResponse({ error: 'Meeting detector not initialized' });
      }
      break;
      
    case 'STOP_REAL_TIME_TRANSCRIPTION':
      if (meetingDetector) {
        meetingDetector.stopRealTimeTranscription();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: true }); // Always succeed for stop
      }
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open
});

// Initialize the meeting detector
const meetingDetector = new MeetingDetector();