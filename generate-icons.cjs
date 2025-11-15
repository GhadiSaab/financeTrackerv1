const fs = require('fs');
const path = require('path');

// Create a proper SVG icon with gradient
const createIconSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
  <path fill="white" d="M150 200 L256 100 L362 200 L330 200 L330 400 L280 400 L280 280 L232 280 L232 400 L182 400 L182 200 Z"/>
  <text x="256" y="450" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">FT</text>
</svg>`;

const publicDir = path.join(__dirname, 'public');
console.log('Generating PWA icons...');

// Generate main icon SVG
const iconSVG = createIconSVG(512);
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSVG);
console.log('✓ Created icon.svg');

// For PNG files, create simple placeholders that will be replaced
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), iconSVG);
  console.log(`✓ Created icon-${size}.png (SVG placeholder)`);
});

// Apple touch icon
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconSVG);
console.log('✓ Created apple-touch-icon.png');

console.log('\n✅ Icons generated! Using SVG format for all icons.');
