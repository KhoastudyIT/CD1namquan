import * as collectionService from './collection.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export async function list(_req, res, next) {
  try {
    ok(res, await collectionService.listCollections());
  } catch (error) {
    next(error);
  }
}


export function create(req, res) {
  const collection = collectionService.createCollection(req.body);
  created(res, collection, 'Tạo bộ sưu tập thành công');
}

export function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const collection = collectionService.updateCollection(id, req.body);
  ok(res, collection, 'Cập nhật bộ sưu tập thành công');
}

export function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  collectionService.deleteCollection(id);
  noContent(res);
}
