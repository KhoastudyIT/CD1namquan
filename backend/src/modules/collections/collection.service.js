import { collections } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listCollections() {
  return collections;
}

export function createCollection(data) {
  const maxId = collections.reduce((max, c) => (c.id > max ? c.id : max), 0);
  const newCollection = {
    id: maxId + 1,
    name: data.name,
    img: data.img || '/images/placeholder.jpg',
  };
  collections.push(newCollection);
  return newCollection;
}

export function updateCollection(id, data) {
  const collection = collections.find(c => c.id === id);
  if (!collection) {
    throw new AppError('Không tìm thấy bộ sưu tập', 404);
  }
  if (data.name !== undefined) collection.name = data.name;
  if (data.img !== undefined) collection.img = data.img;
  return collection;
}

export function deleteCollection(id) {
  const index = collections.findIndex(c => c.id === id);
  if (index === -1) {
    throw new AppError('Không tìm thấy bộ sưu tập', 404);
  }
  const deleted = collections.splice(index, 1);
  return deleted[0];
}
