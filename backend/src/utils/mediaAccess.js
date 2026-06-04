const { resolveReadableMediaUrl } = require('./cloudStorage');

async function signMediaUrl(url) {
  return resolveReadableMediaUrl(url || '');
}

module.exports = { signMediaUrl, resolveReadableMediaUrl };
