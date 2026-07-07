import { collections } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listCollections() {
  return collections;
}

function findIndex(id) {
  const idx = collections.findIndex(c => c.id === Number(id));
  if (idx === -1) throw new AppError('Không tìm thấy bộ sưu tập', 404);
  return idx;
}

export function createCollection(data) {
  const id = collections.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const collection = { id, ...data };
  collections.push(collection);
  return collection;
}

export function updateCollection(id, data) {
  const idx = findIndex(id);
  collections[idx] = { ...collections[idx], ...data };
  return collections[idx];
}

export function deleteCollection(id) {
  const idx = findIndex(id);
  collections.splice(idx, 1);
}
