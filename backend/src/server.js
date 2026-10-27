const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Security and middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/admin', adminRoutes);

const path = require('path');

// Fallback 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Serve frontend build if dist folder exists
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('ExamEase API is running. Build frontend with `npm run build` inside frontend directory.');
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB & Start Server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 ExamEase API Server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  });
}

module.exports = app;
