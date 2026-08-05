const fs = require('fs');
const path = require('path');

const srcIcon = '/home/harshar/.gemini/antigravity-ide/brain/daf70038-5241-47f4-b776-0f2e0583c3fe/media__1785945326724.png';
const srcBanner = path.join(__dirname, 'nunnari banner .png');

const docsDir = path.join(__dirname, 'docs');
const publicDir = path.join(__dirname, 'frontend', 'public');

if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

if (fs.existsSync(srcIcon)) {
  fs.copyFileSync(srcIcon, path.join(publicDir, 'logo.png'));
  fs.copyFileSync(srcIcon, path.join(docsDir, 'logo.png'));
}

if (fs.existsSync(srcBanner)) {
  fs.copyFileSync(srcBanner, path.join(publicDir, 'nunnari_banner.png'));
  fs.copyFileSync(srcBanner, path.join(docsDir, 'nunnari_banner.png'));
  console.log('Successfully copied nunnari banner .png!');
}



