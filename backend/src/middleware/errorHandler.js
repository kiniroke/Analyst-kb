function errorHandler(error, req, res, next) {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "Internal server error.",
    details: error.details || null,
  });
}

module.exports = errorHandler;
