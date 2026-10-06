export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  const status = error.status || 500;
  return response.status(status).json({
    error: status >= 500 ? 'Rupio could not complete the request.' : error.message
  });
}
