const express = require('express');
const cors = require('cors');
require('dotenv').config();

const chatRoutes = require('./routes/chat.routes');
const analysisRoutes = require('./routes/analysis.routes');
const automationRoutes = require('./routes/automation.routes');

const app = express();
const PORT = process.env.PORT || 5006;

// Enable CORS for frontend requests
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Bind API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/automation', automationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Nexus IoT AI-Backend Server is active' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`Nexus IoT AI-Backend Server running on port ${PORT}`);
  console.log(`API endpoints accessible at http://localhost:${PORT}/api`);
  console.log(`======================================================`);
});
