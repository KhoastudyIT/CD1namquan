import * as statsService from './stats.service.js';
import { ok } from '../../utils/response.js';

export function overview(_req, res) {
  ok(res, statsService.getOverview());
}
