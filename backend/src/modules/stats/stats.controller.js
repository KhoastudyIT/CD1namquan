import * as statsService from './stats.service.js';

export function overview(_req, res) {
  const data = statsService.getStatsOverview();
  res.json({ success: true, message: 'Success', data });
}
