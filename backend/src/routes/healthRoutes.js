import express from 'express';

const router = express.Router();

/**
 * Health check endpoint: GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
