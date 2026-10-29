/**
 * 404 Not Found middleware for unsupported routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API route '${req.method} ${req.originalUrl}' does not exist.`,
  });
}

export default notFoundHandler;
