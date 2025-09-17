# Real-Time Meeting Transcription Guide

## 🎤 New Real-Time Features

The Meeting Summarizer now includes **real-time audio transcription** that continuously listens to meeting audio and converts it to text as you speak, without waiting for manual input.

### Key Features
- **Live Audio Capture**: Uses your microphone to capture meeting audio in real-time
- **Instant Transcription**: Converts speech to text immediately using Web Speech API
- **Live Display**: Shows transcription in a floating overlay during meetings
- **Automatic Summarization**: Generates AI summary when meeting ends
- **No Manual Input**: Works completely automatically once started

## 🚀 How It Works

### Automatic Mode
1. **Join a Meeting**: Go to Google Meet, Zoom, or Teams
2. **Auto-Detection**: Extension detects when you enter a meeting
3. **Permission Request**: Browser asks for microphone permission (allow it)
4. **Live Transcription**: Real-time transcript appears in floating overlay
5. **Auto-Summary**: When meeting ends, AI summary is generated automatically

### Manual Control Mode
1. **Click Extension Icon**: Open the Meeting Summarizer popup
2. **Start Listening**: Click "Start Listening" in the Real-time section
3. **Grant Permission**: Allow microphone access when prompted
4. **Monitor Transcript**: Watch live transcript in the popup preview
5. **Stop/Clear**: Use controls to stop listening or clear transcript

## 🎯 Live Transcript Display

### Floating Overlay
- **Location**: Top-right corner of meeting page
- **Content**: Live transcript with timestamps
- **Controls**: Hide/show toggle button
- **Styling**: Semi-transparent dark overlay with white text

### Features
- **Final Text**: Confirmed speech appears in normal text
- **Interim Results**: Uncertain speech appears in gray italics
- **Auto-scroll**: Automatically scrolls to show latest content
- **Timestamps**: Each line includes time when spoken

## 🔧 Setup Requirements

### Browser Permissions
The extension now requires additional permissions:
- **Microphone Access**: For real-time audio capture
- **Tab Capture**: For enhanced meeting detection
- **Desktop Capture**: For advanced audio processing

### Browser Support
- **Chrome 88+**: Full support with Web Speech API
- **Edge 88+**: Full support
- **Firefox**: Limited support (may not work)
- **Safari**: Not supported

### Meeting Platform Requirements
- **Google Meet**: Works best with captions enabled
- **Zoom Web**: Requires browser version, not desktop app
- **Teams Web**: Browser version recommended
- **Audio Quality**: Clear microphone input for best results

## 📋 Usage Instructions

### First Time Setup
1. **Install Extension**: Load unpacked extension in Chrome
2. **Get API Key**: Obtain Gemini API key from Google AI Studio
3. **Configure Extension**: Enter API key in extension popup
4. **Test Microphone**: Join a test meeting to verify audio capture

### During Meetings
1. **Join Meeting**: Go to supported meeting platform
2. **Allow Microphone**: Grant permission when browser prompts
3. **Monitor Transcript**: Check floating overlay for live text
4. **Adjust Display**: Use hide/show toggle if needed
5. **Let It Run**: Extension works automatically until meeting ends

### After Meetings
1. **Auto-Summary**: Summary generates automatically when meeting ends
2. **View Results**: Click extension icon to see summary
3. **Export Options**: Copy, download, or re-summarize with different styles
4. **Clear Data**: Use clear button to remove transcript data

## 🎛️ Controls & Settings

### Popup Controls
- **Start/Stop Listening**: Manual control over transcription
- **Clear Transcript**: Remove current transcript data
- **Live Preview**: See current transcript in popup
- **Summary Styles**: Choose different AI summary formats

### Floating Overlay Controls
- **Hide/Show**: Toggle transcript visibility
- **Auto-scroll**: Automatically enabled
- **Resize**: Fixed size, optimized for readability

## 🔍 Troubleshooting

### Common Issues

#### No Audio Capture
- **Check Permissions**: Ensure microphone access is granted
- **Browser Settings**: Verify site has microphone permissions
- **Hardware**: Test microphone in other applications
- **Platform**: Use web version of meeting platforms, not desktop apps

#### Poor Transcription Quality
- **Audio Quality**: Ensure clear microphone input
- **Background Noise**: Minimize ambient noise
- **Speaking Pace**: Speak clearly and at moderate pace
- **Language**: Currently optimized for English

#### Extension Not Working
- **Reload Extension**: Refresh in chrome://extensions/
- **Check Console**: Look for error messages in browser console
- **Update Browser**: Ensure Chrome is up to date
- **Restart Browser**: Close and reopen Chrome

### Performance Tips
- **Close Unused Tabs**: Reduce browser memory usage
- **Good Internet**: Ensure stable connection for API calls
- **Clear Cache**: Periodically clear browser cache
- **Monitor CPU**: High CPU usage may affect transcription quality

## 🔒 Privacy & Security

### Data Handling
- **Local Processing**: Speech recognition happens in browser
- **Temporary Storage**: Transcripts stored locally during meetings
- **API Calls**: Only final text sent to Gemini API for summarization
- **No Recording**: Audio is not recorded or stored permanently

### Permissions Explained
- **Microphone**: Required for real-time audio capture
- **Tab Capture**: Enhanced meeting detection and audio access
- **Storage**: Save transcripts and settings locally
- **Active Tab**: Access meeting page content

## 📊 Comparison: Real-time vs Manual

| Feature | Real-time Mode | Manual Mode |
|---------|----------------|-------------|
| **Setup** | Automatic | Copy/paste required |
| **Accuracy** | High (live audio) | Depends on source |
| **Speed** | Instant | Manual effort |
| **Completeness** | Full meeting | Partial content |
| **Privacy** | Browser-based | No audio access |
| **Requirements** | Microphone | Text input only |

## 🎯 Best Practices

### For Best Results
1. **Use Quality Microphone**: Better audio = better transcription
2. **Minimize Background Noise**: Find quiet environment
3. **Speak Clearly**: Moderate pace, clear pronunciation
4. **Enable Platform Captions**: Use as backup/verification
5. **Monitor Live Display**: Check transcription accuracy during meeting

### Meeting Etiquette
1. **Inform Participants**: Let others know you're transcribing
2. **Respect Privacy**: Only transcribe with permission
3. **Check Accuracy**: Review transcript before sharing
4. **Secure Storage**: Keep transcripts confidential
5. **Follow Policies**: Comply with company/organization rules

## 🔄 Updates & Improvements

### Current Version Features
- Real-time speech recognition
- Live transcript display
- Automatic meeting detection
- Multiple summary styles
- Export capabilities

### Planned Enhancements
- Multi-language support
- Speaker identification
- Improved accuracy algorithms
- Integration with calendar apps
- Team collaboration features

## 📞 Support

### Getting Help
1. **Check This Guide**: Review troubleshooting section
2. **Browser Console**: Check for error messages
3. **Test Environment**: Try with simple test audio
4. **Update Extension**: Ensure latest version installed

### Reporting Issues
When reporting problems, include:
- Browser version and OS
- Meeting platform used
- Error messages (if any)
- Steps to reproduce issue
- Audio setup details

The real-time transcription feature transforms the Meeting Summarizer into a powerful, hands-free meeting assistant that captures every word and provides instant AI-powered summaries!