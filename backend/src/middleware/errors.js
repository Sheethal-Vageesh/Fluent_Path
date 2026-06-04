function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

function mongooseErrorStatus(err) {
  if (err.name === 'ValidationError') return 400;
  if (err.name === 'CastError') return 400;
  if (err.code === 11000) return 409;
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const mongoStatus = mongooseErrorStatus(err);
  const status = err.statusCode || mongoStatus || 500;
  const message =
    status >= 500
      ? 'Server error'
      : err.message || 'Request failed';
  if (status >= 500) {
    console.error('[API error]', err.message || err);
    if (err.stack) console.error(err.stack);
  }
  res.status(status).json({
    error: message,
    details: err.details,
    ...(process.env.NODE_ENV !== 'production' && status >= 500
      ? { debug: err.message }
      : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };

