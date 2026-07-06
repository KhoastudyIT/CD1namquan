import * as collectionService from './collection.service.js';
import { ok } from '../../utils/response.js';

export async function list(_req, res, next) {
  try {
    ok(res, await collectionService.listCollections());
  } catch (error) {
    next(error);
  }
}
