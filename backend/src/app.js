const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { notFoundHandler, errorHandler } = require('./middleware/errors');
const { authRouter } = require('./routes/auth');
const { clinicianRouter } = require('./routes/clinicians');
const { parentRouter } = require('./routes/parents');
const { n: TOTAL_SESSIONS } = require('./config/stage');
const { isCloudStorageEnabled } = require('./utils/upload');

function createApp() {
  const app = express();

  // Needed so videos served from the API (port 5000) can be played in the UI (port 5173)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));


  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Serve frontend static files
  app.use(express.static(path.join(process.cwd(), 'public')));


  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/config', (_req, res) => {
    res.json({
      totalSessions: TOTAL_SESSIONS,
      storage: isCloudStorageEnabled() ? 'cloud' : 'local',
    });
  });


  app.use('/api/auth', authRouter);
  app.use('/api/clinicians', clinicianRouter);
  app.use('/api/parents', parentRouter);

  // Serve index.html for all other routes (for React Router)
  app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

