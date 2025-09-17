// Popup script for Meeting Summarizer extension
class PopupController {
  constructor() {
    this.currentStyle = 'standard';
    this.currentSummary = null;
    this.currentText = null;
    
    this.init();
  }

  async init() {
    await this.loadStoredData();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get([
        'geminiApiKey', 
        'lastSummary', 
        'lastMeeting'
      ]);
      
      this.apiKey = result.geminiApiKey;
      this.lastSummary = result.lastSummary;
      this.lastMeeting = result.lastMeeting;
      
      if (this.lastSummary) {
        this.currentSummary = this.lastSummary.summary;
        this.currentText = this.lastSummary.originalText;
        this.currentStyle = this.lastSummary.style || 'standard';
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  setupEventListeners() {
    // API Key management
    document.getElementById('saveApiKey').addEventListener('click', () => {
      this.saveApiKey();
    });

    document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveApiKey();
      }
    });

    // Real-time transcription controls
    document.getElementById('toggleTranscription').addEventListener('click', () => {
      this.toggleTranscription();
    });

    document.getElementById('clearTranscript').addEventListener('click', () => {
      this.clearTranscript();
    });

    // Summary style selection
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectStyle(e.target.dataset.style);
      });
    });

    // Summary actions
    document.getElementById('regenerateSummary').addEventListener('click', () => {
      this.regenerateSummary();
    });

    document.getElementById('copySummary').addEventListener('click', () => {
      this.copySummary();
    });

    document.getElementById('exportSummary').addEventListener('click', () => {
      this.exportSummary();
    });

    // Manual summarization
    document.getElementById('summarizeManual').addEventListener('click', () => {
      this.summarizeManualText();
    });
  }

  updateUI() {
    const apiKeySection = document.getElementById('apiKeySection');
    const realtimeSection = document.getElementById('realtimeSection');
    const summarySection = document.getElementById('summarySection');
    const manualSection = document.getElementById('manualSection');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const summaryStatus = document.getElementById('summaryStatus');

    if (!this.apiKey) {
      // Show API key setup
      apiKeySection.classList.remove('hidden');
      realtimeSection.classList.add('hidden');
      summarySection.classList.add('hidden');
      manualSection.classList.add('hidden');
      apiKeyStatus.textContent = 'Enter your Gemini API key to get started';
      apiKeyStatus.className = 'status info';
    } else {
      // API key is set
      apiKeySection.classList.add('hidden');
      realtimeSection.classList.remove('hidden');
      summarySection.classList.remove('hidden');
      manualSection.classList.remove('hidden');

      // Update API key status
      apiKeyStatus.textContent = 'API key configured ✓';
      apiKeyStatus.className = 'status success';

      // Update real-time section
      this.updateRealtimeStatus();

      // Update summary section
      if (this.currentSummary) {
        this.displaySummary();
        summaryStatus.textContent = 'Summary ready';
        summaryStatus.className = 'status success';
      } else if (this.lastMeeting) {
        summaryStatus.textContent = 'Meeting detected - click regenerate to summarize';
        summaryStatus.className = 'status info';
      } else {
        summaryStatus.textContent = 'No recent meeting found';
        summaryStatus.className = 'status info';
      }

      // Update style buttons
      this.updateStyleButtons();
    }
  }

  async saveApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('Please enter a valid API key', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ geminiApiKey: apiKey });
      this.apiKey = apiKey;
      apiKeyInput.value = '';
      this.showStatus('API key saved successfully!', 'success');
      setTimeout(() => this.updateUI(), 1000);
    } catch (error) {
      this.showStatus('Failed to save API key', 'error');
      console.error('Error saving API key:', error);
    }
  }

  selectStyle(style) {
    this.currentStyle = style;
    this.updateStyleButtons();
    
    if (this.currentSummary && this.currentText) {
      this.regenerateSummary();
    }
  }

  updateStyleButtons() {
    document.querySelectorAll('.style-btn').forEach(btn => {
      if (btn.dataset.style === this.currentStyle) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  async regenerateSummary() {
    if (!this.apiKey) {
      this.showStatus('Please configure your API key first', 'error');
      return;
    }

    let textToSummarize = this.currentText;
    
    // If no current text, try to use last meeting transcript
    if (!textToSummarize && this.lastMeeting) {
      textToSummarize = this.lastMeeting.transcript;
    }

    if (!textToSummarize) {
      this.showStatus('No text available to summarize', 'error');
      return;
    }

    this.showLoading(true);

    try {
      const response = await this.sendMessage({
        type: 'SUMMARIZE_TEXT',
        data: {
          text: textToSummarize,
          style: this.currentStyle
        }
      });

      if (response.success) {
        this.currentSummary = response.summary;
        this.currentText = textToSummarize;
        this.displaySummary();
        this.showStatus('Summary generated successfully!', 'success');
      } else {
        this.showStatus(response.error || 'Failed to generate summary', 'error');
      }
    } catch (error) {
      this.showStatus('Error generating summary', 'error');
      console.error('Summarization error:', error);
    } finally {
      this.showLoading(false);
    }
  }

  async summarizeManualText() {
    const manualText = document.getElementById('manualText').value.trim();
    
    if (!manualText) {
      this.showStatus('Please enter some text to summarize', 'error');
      return;
    }

    if (!this.apiKey) {
      this.showStatus('Please configure your API key first', 'error');
      return;
    }

    this.showLoading(true);

    try {
      const response = await this.sendMessage({
        type: 'SUMMARIZE_TEXT',
        data: {
          text: manualText,
          style: this.currentStyle
        }
      });

      if (response.success) {
        this.currentSummary = response.summary;
        this.currentText = manualText;
        this.displaySummary();
        this.showStatus('Summary generated successfully!', 'success');
        document.getElementById('manualText').value = '';
      } else {
        this.showStatus(response.error || 'Failed to generate summary', 'error');
      }
    } catch (error) {
      this.showStatus('Error generating summary', 'error');
      console.error('Manual summarization error:', error);
    } finally {
      this.showLoading(false);
    }
  }

  displaySummary() {
    const summaryContainer = document.getElementById('summaryContainer');
    summaryContainer.textContent = this.currentSummary;
    summaryContainer.classList.remove('hidden');
  }

  async copySummary() {
    if (!this.currentSummary) {
      this.showStatus('No summary to copy', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.currentSummary);
      this.showStatus('Summary copied to clipboard!', 'success');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.currentSummary;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showStatus('Summary copied to clipboard!', 'success');
    }
  }

  exportSummary() {
    if (!this.currentSummary) {
      this.showStatus('No summary to export', 'error');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `meeting-summary-${timestamp}.txt`;
    
    const blob = new Blob([this.currentSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showStatus('Summary exported successfully!', 'success');
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
      loadingOverlay.classList.remove('hidden');
    } else {
      loadingOverlay.classList.add('hidden');
    }
  }

  showStatus(message, type) {
    const summaryStatus = document.getElementById('summaryStatus');
    summaryStatus.textContent = message;
    summaryStatus.className = `status ${type}`;
    
    // Clear status after 3 seconds for success/error messages
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        if (summaryStatus.textContent === message) {
          this.updateUI();
        }
      }, 3000);
    }
  }

  async toggleTranscription() {
    const button = document.getElementById('toggleTranscription');
    const currentText = button.textContent;
    
    if (currentText === 'Start Listening') {
      // Start transcription
      try {
        const response = await this.sendMessage({
          type: 'START_TRANSCRIPTION'
        });
        
        if (response.success) {
          button.textContent = 'Stop Listening';
          button.classList.remove('secondary');
          this.showStatus('Real-time transcription started', 'success');
        } else {
          this.showStatus(response.error || 'Failed to start transcription', 'error');
        }
      } catch (error) {
        this.showStatus('Error starting transcription', 'error');
      }
    } else {
      // Stop transcription
      try {
        const response = await this.sendMessage({
          type: 'STOP_TRANSCRIPTION'
        });
        
        button.textContent = 'Start Listening';
        button.classList.add('secondary');
        this.showStatus('Transcription stopped', 'info');
      } catch (error) {
        this.showStatus('Error stopping transcription', 'error');
      }
    }
  }

  async clearTranscript() {
    try {
      const response = await this.sendMessage({
        type: 'CLEAR_TRANSCRIPT'
      });
      
      if (response.success) {
        document.getElementById('liveTranscriptPreview').textContent = '';
        document.getElementById('liveTranscriptPreview').classList.add('hidden');
        this.showStatus('Transcript cleared', 'success');
      }
    } catch (error) {
      this.showStatus('Error clearing transcript', 'error');
    }
  }

  updateRealtimeStatus() {
    const realtimeStatus = document.getElementById('realtimeStatus');
    const livePreview = document.getElementById('liveTranscriptPreview');
    
    // Check if we're currently in a meeting
    this.sendMessage({ type: 'GET_MEETING_STATUS' }).then(response => {
      if (response.inMeeting) {
        realtimeStatus.textContent = `🎤 In meeting: ${response.meetingTitle || 'Unknown'}`;
        realtimeStatus.className = 'status success';
        
        if (response.transcript && response.transcript.length > 0) {
          livePreview.textContent = response.transcript;
          livePreview.classList.remove('hidden');
        }
      } else {
        realtimeStatus.textContent = 'Not currently in a meeting';
        realtimeStatus.className = 'status info';
        livePreview.classList.add('hidden');
      }
    }).catch(() => {
      realtimeStatus.textContent = 'Status unknown';
      realtimeStatus.className = 'status info';
    });
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});