// Background service worker for Meeting Summarizer
// Import NLP processor
importScripts('nlp-processor.js');

class MeetingSummarizer {
  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log('Meeting Summarizer installed');
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'MEETING_ENDED':
          await this.processMeetingEnd(message.data, sendResponse);
          break;
        case 'SUMMARIZE_TEXT':
          await this.summarizeText(message.data, sendResponse);
          break;
        case 'START_TRANSCRIPTION':
          await this.startTranscription(sender, sendResponse);
          break;
        case 'STOP_TRANSCRIPTION':
          await this.stopTranscription(sender, sendResponse);
          break;
        case 'CLEAR_TRANSCRIPT':
          await this.clearTranscript(sendResponse);
          break;
        case 'GET_MEETING_STATUS':
          await this.getMeetingStatus(sendResponse);
          break;
        case 'TRANSCRIPT_UPDATE':
          await this.handleTranscriptUpdate(message.data, sendResponse);
          break;
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ error: error.message });
    }
  }

  async processMeetingEnd(data, sendResponse) {
    const { transcript, meetingTitle } = data;
    
    if (!transcript || transcript.trim().length === 0) {
      sendResponse({ error: 'No transcript data available' });
      return;
    }

    // Store meeting data temporarily
    await chrome.storage.local.set({
      lastMeeting: {
        transcript,
        title: meetingTitle || 'Untitled Meeting',
        timestamp: new Date().toISOString()
      }
    });

    // Trigger summarization
    const summary = await this.summarizeText({ text: transcript }, () => {});
    
    sendResponse({ 
      success: true, 
      summary,
      message: 'Meeting processed successfully' 
    });
  }

  async summarizeText(data, sendResponse) {
    const { text, style = 'standard' } = data;
    
    try {
      // Get API key from storage
      const result = await chrome.storage.local.get(['geminiApiKey']);
      if (!result.geminiApiKey) {
        sendResponse({ error: 'Gemini API key not configured' });
        return;
      }

      const summary = await this.callGeminiAPI(text, style, result.geminiApiKey);
      
      // Store the summary
      await chrome.storage.local.set({
        lastSummary: {
          summary,
          originalText: text,
          style,
          timestamp: new Date().toISOString()
        }
      });

      sendResponse({ success: true, summary });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async callGeminiAPI(text, style, apiKey) {
    // Preprocess the text using NLP pipeline
    const cleanedText = this.nlpProcessor.preprocessText(text);
    
    if (!cleanedText || cleanedText.trim().length < 50) {
      throw new Error('Insufficient text content for summarization');
    }
    
    // Generate enhanced prompt using NLP processor
    const prompt = this.nlpProcessor.generateSummaryPrompt(cleanedText, style);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async startTranscription(sender, sendResponse) {
    try {
      // Send message to content script to start transcription
      const response = await chrome.tabs.sendMessage(sender.tab.id, {
        type: 'START_REAL_TIME_TRANSCRIPTION'
      });
      
      sendResponse({ success: true, message: 'Transcription started' });
    } catch (error) {
      sendResponse({ error: 'Failed to start transcription: ' + error.message });
    }
  }

  async stopTranscription(sender, sendResponse) {
    try {
      // Send message to content script to stop transcription
      const response = await chrome.tabs.sendMessage(sender.tab.id, {
        type: 'STOP_REAL_TIME_TRANSCRIPTION'
      });
      
      sendResponse({ success: true, message: 'Transcription stopped' });
    } catch (error) {
      sendResponse({ success: true, message: 'Transcription stopped' }); // Always succeed for stop
    }
  }

  async clearTranscript(sendResponse) {
    try {
      await chrome.storage.local.set({
        currentTranscript: '',
        lastMeeting: null
      });
      
      sendResponse({ success: true, message: 'Transcript cleared' });
    } catch (error) {
      sendResponse({ error: 'Failed to clear transcript' });
    }
  }

  async getMeetingStatus(sendResponse) {
    try {
      const result = await chrome.storage.local.get(['currentMeeting', 'currentTranscript']);
      
      sendResponse({
        inMeeting: !!result.currentMeeting,
        meetingTitle: result.currentMeeting?.title || '',
        transcript: result.currentTranscript || ''
      });
    } catch (error) {
      sendResponse({ inMeeting: false, meetingTitle: '', transcript: '' });
    }
  }

  async handleTranscriptUpdate(data, sendResponse) {
    try {
      const { transcript, isComplete } = data;
      
      // Store the current transcript
      await chrome.storage.local.set({
        currentTranscript: transcript
      });
      
      // If meeting is complete, trigger summarization
      if (isComplete && transcript.trim().length > 50) {
        const summary = await this.summarizeText({ text: transcript }, () => {});
        
        // Store the completed meeting
        await chrome.storage.local.set({
          lastMeeting: {
            transcript,
            title: data.meetingTitle || 'Real-time Meeting',
            timestamp: new Date().toISOString()
          },
          currentMeeting: null,
          currentTranscript: ''
        });
        
        sendResponse({ success: true, summary });
      } else {
        sendResponse({ success: true });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
}

// Initialize the background service
new MeetingSummarizer();