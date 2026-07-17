import * as statsService from './stats.service.js';
import { ok } from '../../utils/response.js';

export async function overview(_req, res, next) {
  try {
    ok(res, await statsService.getOverview());
  } catch (err) {
    next(err);
  }
}
