const fs = require('fs');
const path = require('path');

const srcIcon = '/home/harshar/.gemini/antigravity-ide/brain/daf70038-5241-47f4-b776-0f2e0583c3fe/media__1785945326724.png';
const srcBanner = '/home/harshar/.gemini/antigravity-ide/brain/daf70038-5241-47f4-b776-0f2e0583c3fe/media__1785945830666.jpg';

const docsDir = path.join(__dirname, 'docs');
const publicDir = path.join(__dirname, 'frontend', 'public');

if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

if (fs.existsSync(srcIcon)) {
  fs.copyFileSync(srcIcon, path.join(publicDir, 'logo.png'));
  fs.copyFileSync(srcIcon, path.join(docsDir, 'logo.png'));
}

if (fs.existsSync(srcBanner)) {
  fs.copyFileSync(srcBanner, path.join(publicDir, 'nunnarri_logo_banner.jpg'));
  fs.copyFileSync(srcBanner, path.join(docsDir, 'nunnarri_logo_banner.jpg'));
  console.log('Successfully copied Nunnarri banner image!');
}


