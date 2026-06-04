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

function buildContentSecurityPolicy() {
  const mediaSrc = ["'self'", 'blob:'];
  const connectSrc = ["'self'"];

  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  if (bucket) {
    mediaSrc.push(`https://${bucket}.s3.${region}.amazonaws.com`);
    mediaSrc.push(`https://${bucket}.s3.amazonaws.com`);
    connectSrc.push(`https://${bucket}.s3.${region}.amazonaws.com`);
    connectSrc.push(`https://${bucket}.s3.amazonaws.com`);
  }

  const publicBase = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (publicBase) {
    mediaSrc.push(publicBase);
    connectSrc.push(publicBase);
  }

  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', ...mediaSrc.filter((s) => s.startsWith('https://'))],
      mediaSrc,
      connectSrc,
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
    },
  };
}

function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: buildContentSecurityPolicy(),
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

