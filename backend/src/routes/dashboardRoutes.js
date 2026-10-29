import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

/**
 * Endpoint: GET /api/dashboard/stats
 * Aggregated counts for dashboard cards.
 */
router.get('/dashboard/stats', getDashboardStats);

export default router;
