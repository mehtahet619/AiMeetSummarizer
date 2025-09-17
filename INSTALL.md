# Quick Installation Guide

## Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key (keep it safe!)

## Step 2: Install the Extension
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the folder containing these extension files
6. The extension should now appear in your extensions list

## Step 3: Configure the Extension
1. Click the extension icon in your Chrome toolbar (puzzle piece icon if not pinned)
2. Find "Meeting Summarizer" and click on it
3. Enter your Gemini API key in the setup screen
4. Click "Save API Key"
5. You should see "API key configured ✓"

## Step 4: Test the Extension
1. Open the `test-page.html` file in Chrome
2. Copy one of the sample transcripts
3. Click the Meeting Summarizer extension icon
4. Paste the transcript in the "Manual Summarization" section
5. Choose a summary style and click "Summarize Text"

## Troubleshooting

### Extension Won't Load
- Make sure all files are in the same folder
- Check that manifest.json is present
- Try refreshing the extension in chrome://extensions/

### API Errors
- Verify your API key is correct
- Check your Google Cloud billing is enabled
- Ensure you have Gemini API access

### No Meeting Detection
- Enable captions/transcripts in your meeting platform
- Make sure you're on Google Meet, Zoom, or Teams web version
- The extension works best with live captions enabled

## Usage Tips
- The extension automatically detects meetings on supported platforms
- You can also manually paste any text to summarize
- Try different summary styles for different needs
- Export summaries as text files for record keeping

## Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is working
3. Try the manual summarization feature first
4. Make sure you're using a supported meeting platform