import * as collectionService from './collection.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export async function list(_req, res, next) {
  try {
    ok(res, await collectionService.listCollections());
  } catch (error) {
    next(error);
  }
}


export async function create(req, res) {
  const collection = await collectionService.createCollection(req.body);
  created(res, collection, 'Tạo bộ sưu tập thành công');
}

export async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const collection = await collectionService.updateCollection(id, req.body);
  ok(res, collection, 'Cập nhật bộ sưu tập thành công');
}

export async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  await collectionService.deleteCollection(id);
  noContent(res);
}
