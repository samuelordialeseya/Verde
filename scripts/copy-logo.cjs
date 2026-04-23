const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'Verde Logo Transparent.png');
const dest = path.join(__dirname, '..', 'public', 'assets', 'verde-logo.png');

try {
  fs.copyFileSync(src, dest);
  console.log('✅ Logo copied successfully!');
} catch (err) {
  console.error('❌ Failed to copy logo:', err.message);
}
