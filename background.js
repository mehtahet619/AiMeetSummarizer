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
}

// Initialize the background service
new MeetingSummarizer();