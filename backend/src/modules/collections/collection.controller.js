import * as collectionService from './collection.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, collectionService.listCollections());
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
