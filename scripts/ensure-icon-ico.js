/**
 * Converts public/icon.png to public/icon.ico for use in Windows shortcut.
 * Run from project root: node scripts/ensure-icon-ico.js
 */
const path = require('path');
const fs = require('fs');

const APP_DIR = path.resolve(__dirname, '..');
const PNG_PATH = path.join(APP_DIR, 'public', 'icon.png');
const ICO_PATH = path.join(APP_DIR, 'public', 'icon.ico');

if (!fs.existsSync(PNG_PATH)) {
  console.warn('public/icon.png not found. Place an icon there and run again.');
  process.exit(1);
}

async function main() {
  const pngToIco = require('png-to-ico');
  const buf = await pngToIco(PNG_PATH);
  fs.writeFileSync(ICO_PATH, buf);
  console.log('Created public/icon.ico from public/icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
