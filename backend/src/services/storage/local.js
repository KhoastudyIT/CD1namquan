import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../../middleware/errorHandler.js';
import { PUBLIC_KEY_PREFIXES } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

export class LocalStorage {
  #port;
  #publicUrl;

  constructor() {
    this.#port = process.env.PORT || 3000;
    this.#publicUrl = process.env.PUBLIC_URL || `http://localhost:${this.#port}`;
  }

  #assertPublicKey(key) {
    if (typeof key !== 'string' || !PUBLIC_KEY_PREFIXES.some(p => key.startsWith(p))) {
      throw new AppError(`Object key không hợp lệ: ${key}`, 400);
    }
  }

  #resolveKeyPath(key) {
    this.#assertPublicKey(key);
    const filePath = path.resolve(UPLOADS_DIR, key);
    if (!filePath.startsWith(UPLOADS_DIR + path.sep)) {
      throw new AppError(`Object key không hợp lệ: ${key}`, 400);
    }
    return filePath;
  }

  async getSignedUrl(key, { method = 'GET' } = {}) {
    this.#assertPublicKey(key);
    if (method === 'PUT') {
      return `${this.#publicUrl}/api/v1/uploads/file/${key}`;
    }
    return this.getPublicUrl(key);
  }

  getPublicUrl(key) {
    this.#assertPublicKey(key);
    return `${this.#publicUrl}/uploads/${key}`;
  }

  keyFromPublicUrl(url) {
    if (typeof url !== 'string') return null;
    const prefix = `${this.#publicUrl}/uploads/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  async getObjectBuffer(key) {
    const filePath = this.#resolveKeyPath(key);
    if (!fs.existsSync(filePath)) throw new AppError('File không tồn tại', 404);
    return await fs.promises.readFile(filePath);
  }

  async delete(key) {
    const filePath = this.#resolveKeyPath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => { });
    }
  }

  async saveFile(key, buffer) {
    const filePath = this.#resolveKeyPath(key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, buffer);
  }

  async bootstrap() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    }
  }
}
