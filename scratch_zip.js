const { execSync } = require('child_process');
try {
  console.log('Running zip command...');
  execSync('powershell -Command "Compress-Archive -Path \'p:/New folder/library/*\' -DestinationPath \'p:/New folder/frontend/public/nexus-iot-library.zip\' -Force"');
  console.log('Zip completed successfully!');
} catch (e) {
  console.error('Error running zip:', e.message);
}
