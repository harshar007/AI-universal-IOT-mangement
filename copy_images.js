const fs = require('fs');
const path = require('path');

const src = '/home/harshar/.gemini/antigravity-ide/brain/4685b3c1-d3d6-4418-a123-ee193906e98b/nexus_dashboard_ui_mockup_1785068560811.png';
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
const dest = path.join(docsDir, 'nexus_dashboard_ui_mockup.png');
fs.copyFileSync(src, dest);
console.log('Successfully copied image to:', dest);
