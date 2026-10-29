import leaveService from '../services/leaveService.js';

/**
 * Dashboard Controller
 * Returns aggregated leave statistics and employee counts for dashboard summary cards.
 */

/**
 * GET /api/dashboard/stats
 */
export async function getDashboardStats(req, res, next) {
  try {
    const stats = await leaveService.getDashboardStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getDashboardStats,
};
