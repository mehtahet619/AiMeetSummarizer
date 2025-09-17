// NLP Processing utilities for Meeting Summarizer
class NLPProcessor {
  constructor() {
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'um', 'uh', 'like', 'you', 'know',
      'so', 'well', 'okay', 'right', 'yeah', 'yes', 'no'
    ]);
  }

  /**
   * Clean and preprocess meeting transcript text
   * @param {string} text - Raw transcript text
   * @returns {string} - Cleaned text
   */
  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove timestamps in various formats
    let cleaned = text.replace(/\[\d{1,2}:\d{2}:\d{2}(?:\s?[AP]M)?\]/gi, '');
    cleaned = cleaned.replace(/\d{1,2}:\d{2}:\d{2}(?:\s?[AP]M)?/gi, '');
    
    // Remove speaker labels (e.g., "John:", "Speaker 1:", etc.)
    cleaned = cleaned.replace(/^[A-Za-z\s]+\d*:\s*/gm, '');
    cleaned = cleaned.replace(/^[A-Za-z\s]+:\s*/gm, '');
    
    // Remove common meeting platform artifacts
    cleaned = cleaned.replace(/\(joined\)/gi, '');
    cleaned = cleaned.replace(/\(left\)/gi, '');
    cleaned = cleaned.replace(/\(recording started\)/gi, '');
    cleaned = cleaned.replace(/\(recording stopped\)/gi, '');
    cleaned = cleaned.replace(/\(muted\)/gi, '');
    cleaned = cleaned.replace(/\(unmuted\)/gi, '');
    
    // Remove excessive whitespace and normalize
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');
    cleaned = cleaned.trim();
    
    // Remove very short lines (likely noise)
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 10 && !this.isLikelyNoise(trimmed);
    });
    
    return filteredLines.join('\n');
  }

  /**
   * Check if a line is likely noise/artifacts
   * @param {string} line - Text line to check
   * @returns {boolean} - True if likely noise
   */
  isLikelyNoise(line) {
    const lowerLine = line.toLowerCase();
    
    // Common noise patterns
    const noisePatterns = [
      /^(um|uh|like|you know|so|well|okay|right|yeah|yes|no)$/,
      /^[a-z]\s*$/,
      /^\d+$/,
      /^[^\w\s]*$/,
      /^(audio|video|connection|quality|issue|problem)$/i
    ];
    
    return noisePatterns.some(pattern => pattern.test(lowerLine));
  }

  /**
   * Tokenize text into words
   * @param {string} text - Text to tokenize
   * @returns {string[]} - Array of tokens
   */
  tokenize(text) {
    if (!text) return [];
    
    // Simple word tokenization
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !this.stopWords.has(token));
  }

  /**
   * Remove stop words from text
   * @param {string} text - Input text
   * @returns {string} - Text with stop words removed
   */
  removeStopWords(text) {
    const words = text.split(/\s+/);
    const filteredWords = words.filter(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      return cleanWord.length > 1 && !this.stopWords.has(cleanWord);
    });
    
    return filteredWords.join(' ');
  }

  /**
   * Extract key phrases from text
   * @param {string} text - Input text
   * @param {number} maxPhrases - Maximum number of phrases to return
   * @returns {string[]} - Array of key phrases
   */
  extractKeyPhrases(text, maxPhrases = 10) {
    if (!text) return [];
    
    // Simple n-gram extraction (2-3 word phrases)
    const sentences = text.split(/[.!?]+/);
    const phrases = new Map();
    
    sentences.forEach(sentence => {
      const words = this.tokenize(sentence);
      
      // Extract 2-grams and 3-grams
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = words.slice(i, i + 2).join(' ');
        phrases.set(bigram, (phrases.get(bigram) || 0) + 1);
        
        if (i < words.length - 2) {
          const trigram = words.slice(i, i + 3).join(' ');
          phrases.set(trigram, (phrases.get(trigram) || 0) + 1);
        }
      }
    });
    
    // Sort by frequency and return top phrases
    return Array.from(phrases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxPhrases)
      .map(([phrase]) => phrase);
  }

  /**
   * Identify action items in text
   * @param {string} text - Input text
   * @returns {string[]} - Array of potential action items
   */
  extractActionItems(text) {
    if (!text) return [];
    
    const actionPatterns = [
      /(?:will|should|need to|have to|must|going to|plan to)\s+([^.!?]+)/gi,
      /(?:action item|todo|task|assignment):\s*([^.!?]+)/gi,
      /(?:follow up|next step|next steps):\s*([^.!?]+)/gi,
      /(?:assigned to|responsible for|owner):\s*([^.!?]+)/gi,
      /(?:by|due|deadline|before)\s+(?:next week|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday|\d+\/\d+|\d+\-\d+)/gi
    ];
    
    const actionItems = [];
    
    actionPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          actionItems.push(match[1].trim());
        }
      }
    });
    
    return [...new Set(actionItems)]; // Remove duplicates
  }

  /**
   * Extract meeting participants from text
   * @param {string} text - Input text
   * @returns {string[]} - Array of participant names
   */
  extractParticipants(text) {
    if (!text) return [];
    
    const participants = new Set();
    
    // Look for speaker patterns
    const speakerMatches = text.matchAll(/^([A-Za-z\s]+):/gm);
    for (const match of speakerMatches) {
      const name = match[1].trim();
      if (name.length > 1 && name.length < 30 && !name.includes('Speaker')) {
        participants.add(name);
      }
    }
    
    // Look for name mentions
    const namePatterns = [
      /(?:thanks|thank you),?\s+([A-Z][a-z]+)/gi,
      /([A-Z][a-z]+),?\s+(?:can you|could you|would you)/gi,
      /(?:hi|hello),?\s+([A-Z][a-z]+)/gi
    ];
    
    namePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 1) {
          participants.add(match[1]);
        }
      }
    });
    
    return Array.from(participants);
  }

  /**
   * Calculate text statistics
   * @param {string} text - Input text
   * @returns {object} - Statistics object
   */
  getTextStatistics(text) {
    if (!text) {
      return {
        wordCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        averageWordsPerSentence: 0,
        readingTimeMinutes: 0
      };
    }
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const averageWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // Assuming 200 words per minute
    
    return {
      wordCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence,
      readingTimeMinutes
    };
  }

  /**
   * Generate a structured summary prompt for the AI
   * @param {string} text - Preprocessed text
   * @param {string} style - Summary style
   * @returns {string} - Formatted prompt
   */
  generateSummaryPrompt(text, style = 'standard') {
    const stats = this.getTextStatistics(text);
    const keyPhrases = this.extractKeyPhrases(text, 5);
    const actionItems = this.extractActionItems(text);
    const participants = this.extractParticipants(text);
    
    let prompt = `You are an AI meeting assistant. Analyze and summarize the following meeting transcript.\n\n`;
    
    // Add context information
    if (stats.wordCount > 0) {
      prompt += `Meeting Context:\n`;
      prompt += `- Word count: ${stats.wordCount}\n`;
      prompt += `- Estimated duration: ${stats.readingTimeMinutes} minutes of content\n`;
      
      if (participants.length > 0) {
        prompt += `- Participants mentioned: ${participants.join(', ')}\n`;
      }
      
      if (keyPhrases.length > 0) {
        prompt += `- Key topics: ${keyPhrases.join(', ')}\n`;
      }
      
      prompt += `\n`;
    }
    
    // Style-specific instructions
    switch (style) {
      case 'short':
        prompt += `Provide a brief 2-3 sentence summary focusing on the main outcome and key decisions.\n\n`;
        break;
        
      case 'detailed':
        prompt += `Provide a comprehensive summary including:\n`;
        prompt += `1. Executive summary (2-3 sentences)\n`;
        prompt += `2. Detailed discussion points with context\n`;
        prompt += `3. Decisions made and rationale\n`;
        prompt += `4. Action items with owners and deadlines\n`;
        prompt += `5. Next steps and follow-up items\n\n`;
        break;
        
      case 'action-items':
        prompt += `Focus specifically on extracting and organizing:\n`;
        prompt += `1. All action items and tasks mentioned\n`;
        prompt += `2. Who is responsible for each item\n`;
        prompt += `3. Any deadlines or timeframes mentioned\n`;
        prompt += `4. Priority levels if indicated\n\n`;
        break;
        
      default: // standard
        prompt += `Provide a clear and concise summary including:\n`;
        prompt += `1. Executive summary (2-3 sentences)\n`;
        prompt += `2. Key discussion points (bulleted)\n`;
        prompt += `3. Action items and responsibilities (if mentioned)\n`;
        prompt += `4. Important decisions or outcomes\n\n`;
    }
    
    prompt += `Meeting Transcript:\n${text}`;
    
    return prompt;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NLPProcessor;
} else if (typeof window !== 'undefined') {
  window.NLPProcessor = NLPProcessor;
}