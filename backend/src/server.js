require('dotenv').config();

const { createApp } = require('./app');
const { connectToDb } = require('./utils/db');
const { TOTAL_SESSIONS } = require('./config/stage');
const { isCloudStorageEnabled } = require('./utils/upload');

const PORT = process.env.PORT || 5000;

async function main() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  await connectToDb(process.env.MONGODB_URI);

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`Stage sessions (STAGE_N): ${TOTAL_SESSIONS}`);
    console.log(`Video storage: ${isCloudStorageEnabled() ? 'cloud (S3)' : 'local (uploads/)'}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

