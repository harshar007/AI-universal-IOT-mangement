const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDB, userPool, iotPool } = require('./config/db');
const authRoutes = require('./presentation/routes/authRoutes');
const deviceRoutes = require('./presentation/routes/deviceRoutes');
const sensorRoutes = require('./presentation/routes/sensorRoutes');
const aiRoutes = require('./presentation/routes/aiRoutes');
const widgetRoutes = require('./presentation/routes/widgetRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Initialize Database connection and table structure
initDB();

// Bind API Routes
app.use('/api', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/widgets', widgetRoutes);

// Health check endpoint verifying dual databases
app.get('/health', async (req, res) => {
  let userDbStatus = 'UNKNOWN';
  let iotDbStatus = 'UNKNOWN';

  try {
    const uRes = await userPool.query('SELECT 1');
    if (uRes) userDbStatus = 'UP';
  } catch (err) {
    userDbStatus = 'DOWN: ' + err.message;
  }

  try {
    const iRes = await iotPool.query('SELECT 1');
    if (iRes) iotDbStatus = 'UP';
  } catch (err) {
    iotDbStatus = 'DOWN: ' + err.message;
  }

  const isHealthy = userDbStatus === 'UP' && iotDbStatus === 'UP';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    message: 'Nexus IoT Backend Server Status',
    databases: {
      userDb: userDbStatus,
      iotDb: iotDbStatus
    },
    timestamp: new Date().toISOString()
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`Nexus IoT Backend Server running on port ${PORT}`);
  console.log(`API endpoints accessible at http://localhost:${PORT}/api`);
  console.log(`Dual Database Architecture: User DB & IoT DB enabled`);
  console.log(`======================================================`);
});
