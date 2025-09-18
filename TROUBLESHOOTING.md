# Troubleshooting Guide

## 🔍 "Not Transcribing Anything" Issue

If you click "Start Listening" but nothing is being transcribed, follow these steps:

### Step 1: Check Browser Console
1. **Open Developer Tools**: Press `F12` or right-click → "Inspect"
2. **Go to Console Tab**: Look for any error messages
3. **Look for Meeting Summarizer logs**: Should see messages starting with "Meeting Summarizer:"

### Step 2: Test Speech Recognition
1. **Open the debug test page**: `debug-test.html`
2. **Click "Test Speech Recognition"**: This tests if your browser supports speech recognition
3. **Grant microphone permission**: Allow when prompted
4. **Speak clearly**: You should see transcribed text in the log

### Step 3: Check Microphone Permissions
1. **Click the microphone icon** in Chrome's address bar
2. **Ensure "Allow" is selected** for microphone access
3. **Try refreshing the page** and test again

### Step 4: Verify Meeting Detection
1. **Join a real meeting** (Google Meet, Zoom, or Teams)
2. **Open extension popup**: Should show "Meeting detected"
3. **If not detected**: Try refreshing the meeting page

### Step 5: Test Extension Directly
1. **Open debug test page**: `debug-test.html`
2. **Click "Test Extension Transcription"**: Tests the full extension flow
3. **Check console logs**: Look for detailed error messages

## 🚨 Common Issues & Solutions

### Issue: "Speech recognition not supported"
**Cause**: Browser doesn't support Web Speech API
**Solution**: 
- Use Chrome 25+ or Edge 79+
- Firefox and Safari have limited support
- Try Chrome if using another browser

### Issue: "Microphone permission denied"
**Cause**: Browser blocked microphone access
**Solution**:
1. Click microphone icon in address bar
2. Select "Always allow" for the site
3. Refresh page and try again

### Issue: "No meeting tab found"
**Cause**: Extension can't find meeting platform tab
**Solution**:
1. Make sure you're on meet.google.com, zoom.us, or teams.microsoft.com
2. Refresh the meeting page
3. Try reloading the extension

### Issue: "Meeting detector not initialized"
**Cause**: Content script didn't load properly
**Solution**:
1. Refresh the meeting page
2. Reload extension in chrome://extensions/
3. Check if extension is enabled

### Issue: Transcription starts but no text appears
**Cause**: Audio input issues or speech recognition problems
**Solution**:
1. **Check microphone**: Test in other apps
2. **Speak clearly**: Avoid background noise
3. **Check language**: Extension uses English (US)
4. **Try headphones**: Reduces echo and feedback

### Issue: "Failed to start transcription"
**Cause**: Various technical issues
**Solution**:
1. **Check console**: Look for specific error messages
2. **Restart browser**: Close and reopen Chrome
3. **Update browser**: Ensure latest Chrome version
4. **Disable other extensions**: Test with minimal extensions

## 🔧 Debug Steps

### Enable Verbose Logging
1. Open meeting page
2. Press `F12` → Console tab
3. Look for "Meeting Summarizer:" messages
4. These show detailed status information

### Test Individual Components

#### Test 1: Basic Speech Recognition
```javascript
// Paste in console to test speech recognition directly
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.onresult = (e) => console.log('Speech:', e.results[0][0].transcript);
recognition.start();
```

#### Test 2: Microphone Access
```javascript
// Paste in console to test microphone
navigator.mediaDevices.getUserMedia({audio: true})
  .then(() => console.log('Microphone OK'))
  .catch(e => console.error('Microphone error:', e));
```

#### Test 3: Extension Communication
```javascript
// Paste in console to test extension
chrome.runtime.sendMessage({type: 'GET_MEETING_STATUS'}, 
  response => console.log('Extension response:', response));
```

## 📋 Diagnostic Checklist

Before reporting issues, verify:

- [ ] **Browser**: Using Chrome 88+ or Edge 79+
- [ ] **Microphone**: Working in other applications
- [ ] **Permissions**: Microphone allowed for the site
- [ ] **Meeting Platform**: On supported site (Meet/Zoom/Teams)
- [ ] **Extension**: Loaded and enabled in chrome://extensions/
- [ ] **API Key**: Configured in extension popup
- [ ] **Console**: No error messages in developer tools

## 🆘 Still Not Working?

### Collect Debug Information
1. **Browser version**: Help → About Chrome
2. **Extension version**: Check manifest.json
3. **Console errors**: Copy any error messages
4. **Meeting platform**: Which site you're using
5. **Operating system**: Windows/Mac/Linux

### Try Alternative Method
If real-time transcription isn't working:
1. **Use manual summarization**: Copy/paste meeting text
2. **Enable platform captions**: Use built-in meeting captions
3. **Record audio separately**: Use other recording tools

### Reset Extension
1. **Go to chrome://extensions/**
2. **Remove the extension**
3. **Reload the unpacked extension**
4. **Reconfigure API key**
5. **Test on a fresh meeting**

The most common issue is microphone permissions - make sure Chrome has access to your microphone and you've granted permission for the meeting site!