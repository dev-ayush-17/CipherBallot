require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');

const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const voterRoutes = require('./routes/voters');
const adminRoutes = require('./routes/admin');
const candidateRoutes = require('./routes/candidates');

// Initialize Express app
const app = express();

// ─── Connect to Database ────────────────────────────────────────────────────
connectDB();

// ─── Configure Passport ─────────────────────────────────────────────────────
configurePassport();

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.FRONTEND_URL === '*' 
      ? true 
      : (process.env.FRONTEND_URL || 'http://localhost:5173'),
    credentials: true,
  })
);
app.use(morgan('dev')); // Request logging
app.use(express.json({ limit: '10mb' })); // JSON body parser
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize()); // Passport init (no sessions — JWT only)

// ─── Static Files (uploads) ─────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CipherBallot API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🗳️  CipherBallot Backend API`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api\n`);
});

module.exports = app;
