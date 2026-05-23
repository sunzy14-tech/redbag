function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || '服务器错误'
  });
}

module.exports = { errorHandler };

