# Meeting Summarizer Chrome Extension

An AI-powered Chrome extension that automatically summarizes online meetings using advanced NLP processing and the Gemini API.

## Features

### 🤖 Automatic Meeting Detection
- Detects when meetings end on popular platforms:
  - Google Meet
  - Zoom (web client)
  - Microsoft Teams
- Automatically captures meeting transcripts and captions

### 📝 Advanced NLP Pipeline
- Text preprocessing and cleaning
- Noise removal and normalization
- Key phrase extraction
- Action item identification
- Participant detection

### 🎯 Multiple Summary Styles
- **Standard**: Balanced summary with key points and action items
- **Short**: Brief 2-3 sentence overview
- **Detailed**: Comprehensive analysis with context
- **Action Items**: Focused on tasks and responsibilities

### 🔐 Secure API Key Management
- Secure storage using Chrome's storage API
- First-run setup wizard
- API key validation

### 💾 Export & Share Options
- Copy to clipboard
- Export as text file
- Manual text summarization
- Re-summarize with different styles

## Installation

### Prerequisites
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Chrome browser (version 88+)

### Install the Extension
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

### Setup
1. Click the extension icon in your toolbar
2. Enter your Gemini API key in the setup screen
3. Click "Save API Key"
4. You're ready to go!

## Usage

### Automatic Summarization
1. Join a meeting on Google Meet, Zoom, or Teams
2. The extension automatically detects when you're in a meeting
3. When the meeting ends, it captures the transcript
4. A summary is automatically generated and stored
5. Click the extension icon to view your summary

### Manual Summarization
1. Click the extension icon
2. Paste meeting text in the "Manual Summarization" section
3. Choose your preferred summary style
4. Click "Summarize Text"

### Summary Management
- **Regenerate**: Create a new summary with a different style
- **Copy**: Copy the summary to your clipboard
- **Export**: Download the summary as a text file

## Technical Architecture

### Core Components

#### Content Script (`content.js`)
- Detects meeting platforms and events
- Monitors for meeting start/end
- Captures transcript data from captions
- Handles platform-specific selectors

#### Background Service Worker (`background.js`)
- Processes meeting data
- Manages Gemini API communication
- Handles message passing between components
- Stores summaries and settings

#### NLP Processor (`nlp-processor.js`)
- Text preprocessing and cleaning
- Stop word removal
- Key phrase extraction
- Action item identification
- Participant detection

#### Popup Interface (`popup.html`, `popup.js`)
- User interface for configuration
- Summary display and management
- Export and sharing functionality
- Manual summarization tools

### Data Flow
1. Content script detects meeting events
2. Transcript data is captured and cleaned
3. Background script processes the data through NLP pipeline
4. Gemini API generates the summary
5. Summary is stored and displayed in popup

## API Integration

### Gemini API Configuration
The extension uses Google's Gemini Pro model for text generation:

```javascript
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  })
});
```

### Prompt Engineering
The extension uses sophisticated prompts tailored for each summary style:

- **Context-aware**: Includes meeting statistics and key phrases
- **Style-specific**: Different instructions for each summary type
- **Structured output**: Consistent formatting across summaries

## Privacy & Security

### Data Handling
- **Local Storage**: All data is stored locally in Chrome's storage
- **No External Servers**: Direct communication with Gemini API only
- **Temporary Processing**: Transcripts are processed and can be cleared
- **API Key Security**: Keys are stored securely using Chrome's storage API

### Permissions
- `storage`: For saving settings and summaries
- `activeTab`: For accessing meeting pages
- `scripting`: For injecting content scripts
- Host permissions for meeting platforms

## Troubleshooting

### Common Issues

#### Extension Not Detecting Meetings
- Ensure you're on a supported platform (Google Meet, Zoom, Teams)
- Check that captions/transcripts are enabled in the meeting
- Refresh the meeting page and reload the extension

#### API Key Issues
- Verify your Gemini API key is valid
- Check your API quota and billing settings
- Ensure the key has proper permissions

#### No Transcript Captured
- Enable captions in your meeting platform
- Check if the meeting platform has updated their UI (selectors may need updating)
- Try manual summarization as a workaround

### Debug Mode
Enable Chrome Developer Tools and check the console for detailed logs:
1. Right-click the extension icon → "Inspect popup"
2. Go to the meeting page → F12 → Console tab
3. Look for "Meeting Summarizer" log messages

## Development

### Project Structure
```
meeting-summarizer/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Content script for meeting detection
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── nlp-processor.js      # NLP processing utilities
├── icons/                # Extension icons
└── README.md             # This file
```

### Building and Testing
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test on a meeting platform

### Adding New Platforms
To add support for a new meeting platform:

1. Update `manifest.json` host permissions
2. Add platform detection in `content.js`
3. Implement platform-specific selectors
4. Test transcript capture functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different meeting platforms
5. Submit a pull request

## License

This project is licensed under the **GNU Affero General Public License v3.0** – see the [LICENSE](LICENSE) file for details.


## Changelog

### Version 1.0.0
- Initial release
- Support for Google Meet, Zoom, and Teams
- Multiple summary styles
- Automatic and manual summarization
- Export functionality
- Secure API key management

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## Acknowledgments

- Google Gemini API for AI-powered summarization
- Chrome Extensions API for platform integration
- Meeting platform providers for accessible transcript data
