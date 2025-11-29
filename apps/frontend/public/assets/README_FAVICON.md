# Favicon Setup Instructions

To create optimized favicons from your logo (csm-2.webp), you have two options:

## Option 1: Use Online Favicon Generator (Recommended)

1. Go to https://favicon.io/favicon-converter/ or https://realfavicongenerator.net/
2. Upload your `csm-2.webp` logo
3. Configure settings:
   - Add padding (10-15%) to prevent hard edges
   - Ensure square aspect ratio
   - Generate all sizes
4. Download the generated favicon package
5. Extract and place these files in `apps/frontend/public/assets/`:
   - favicon.ico
   - favicon-16x16.png
   - favicon-32x32.png
   - apple-touch-icon.png (180x180)
   - android-chrome-192x192.png
   - android-chrome-512x512.png

## Option 2: Use ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
cd apps/frontend/public/assets

# Create square version with padding (assuming logo is centered)
# Resize to different sizes
convert csm-2.webp -resize 512x512 -background transparent -gravity center -extent 512x512 android-chrome-512x512.png
convert csm-2.webp -resize 192x192 -background transparent -gravity center -extent 192x192 android-chrome-192x192.png
convert csm-2.webp -resize 180x180 -background transparent -gravity center -extent 180x180 apple-touch-icon.png
convert csm-2.webp -resize 32x32 -background transparent -gravity center -extent 32x32 favicon-32x32.png
convert csm-2.webp -resize 16x16 -background transparent -gravity center -extent 16x16 favicon-16x16.png

# Create ICO file (combines multiple sizes)
convert favicon-16x16.png favicon-32x32.png -colors 256 favicon.ico
```

## Current Status

The HTML is already configured to use these favicon files. Once you generate and place them in the assets folder, they will automatically be used.
