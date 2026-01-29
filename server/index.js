require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');

/**
 * SkillSwap Express Server
 * Main entry point for the backend API
 */

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Route for root - Redirect to login page instead of the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes')); // Authentication routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/skills', require('./routes/skillRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/redeem', require('./routes/redeemRoutes'));
app.use('/api/experiences', require('./routes/experienceRoutes'));
app.use('/api/startups', require('./routes/startupRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'SkillSwap API is running!',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SkillSwap server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
