import * as collectionService from './collection.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, collectionService.listCollections());
}

export function create(req, res) {
  const collection = collectionService.createCollection(req.body);
  created(res, collection, 'Đã tạo bộ sưu tập');
}

export function update(req, res) {
  const collection = collectionService.updateCollection(req.params.id, req.body);
  ok(res, collection, 'Đã cập nhật bộ sưu tập');
}

export function remove(req, res) {
  collectionService.deleteCollection(req.params.id);
  noContent(res);
}
