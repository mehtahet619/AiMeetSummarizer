# Icon Creation Guide

This extension requires three icon sizes for proper Chrome integration:

## Required Icons
- `icon16.png` - 16x16 pixels (toolbar)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Design Guidelines
- Use a clean, professional design
- Consider a microphone or document icon theme
- Ensure good visibility at small sizes
- Use consistent colors across all sizes

## Quick Creation Options

### Option 1: Online Icon Generator
1. Visit [favicon.io](https://favicon.io/favicon-generator/)
2. Create a simple design with text "MS" or a microphone icon
3. Download and rename files to match required names

### Option 2: Simple Text Icons
Create simple colored squares with "MS" text:
- Background: #1a73e8 (Google Blue)
- Text: White
- Font: Bold, centered

### Option 3: Use Existing Icons
You can temporarily use any 16x16, 48x48, and 128x128 PNG files renamed appropriately for testing.

## Placeholder Creation
For quick testing, you can create solid color squares:
```bash
# Create simple colored squares (requires ImageMagick)
convert -size 16x16 xc:#1a73e8 icon16.png
convert -size 48x48 xc:#1a73e8 icon48.png  
convert -size 128x128 xc:#1a73e8 icon128.png
```

The extension will work without custom icons, but Chrome will show default placeholder icons.