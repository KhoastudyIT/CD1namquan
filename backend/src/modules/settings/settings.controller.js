import * as settingsService from './settings.service.js';
import { ok } from '../../utils/response.js';

export async function get(_req, res) {
  ok(res, await settingsService.getCompanyInfo());
}

export async function update(req, res) {
  const info = await settingsService.updateCompanyInfo(req.body);
  ok(res, info, 'Cập nhật thông tin công ty thành công');
}
