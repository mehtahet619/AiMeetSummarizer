// Content script for detecting meeting events and extracting transcripts
class MeetingDetector {
  constructor() {
    this.platform = this.detectPlatform();
    this.isInMeeting = false;
    this.transcript = '';
    this.meetingTitle = '';
    this.observers = [];
    
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
    
    // Start monitoring for transcript
    this.startTranscriptCapture();
  }

  onMeetingEnd() {
    console.log('Meeting ended');
    this.isInMeeting = false;
    
    // Process the collected transcript
    if (this.transcript.trim().length > 0) {
      this.processMeetingTranscript();
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
    
    // Send transcript to background script for processing
    chrome.runtime.sendMessage({
      type: 'MEETING_ENDED',
      data: {
        transcript: this.transcript,
        meetingTitle: this.meetingTitle,
        platform: this.platform,
        timestamp: new Date().toISOString()
      }
    }, (response) => {
      if (response && response.success) {
        console.log('Meeting processed successfully');
        this.showNotification('Meeting summary generated!');
      } else {
        console.error('Failed to process meeting:', response?.error);
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

  cleanup() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize the meeting detector
new MeetingDetector();