import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PUBLIC_KEY_PREFIXES } from './constants.js';
import { AppError } from '../../middleware/errorHandler.js';

export class MinioStorage {
  #client;
  #presignClient;
  #bucket;
  #endpoint;   // nội bộ: http://minio:9000 (backend → MinIO)
  #publicUrl;  // ngoài: http://localhost:9000 (trình duyệt → MinIO)
  #uploadUrlTtl;
  #viewUrlTtl;

  constructor(cfg) {
    this.#endpoint     = cfg.endpoint.replace(/\/$/, '');
    this.#publicUrl    = cfg.publicUrl.replace(/\/$/, '');
    this.#bucket       = cfg.publicBucket;
    this.#uploadUrlTtl = cfg.uploadUrlTtl;
    this.#viewUrlTtl   = cfg.viewUrlTtl;

    const credentials = { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey };
    const common = { region: 'us-east-1', forcePathStyle: true, credentials };

    this.#client = new S3Client({ endpoint: this.#endpoint, ...common });

    // Client riêng để ký URL: ký theo publicUrl để Host trong chữ ký khớp với
    // Host trình duyệt gửi lên, nếu không MinIO sẽ từ chối chữ ký.
    this.#presignClient = new S3Client({ endpoint: this.#publicUrl, ...common });
  }

  #assertPublicKey(key) {
    if (!PUBLIC_KEY_PREFIXES.some(p => key.startsWith(p))) {
      throw new AppError(`Object key không hợp lệ: ${key}`, 400);
    }
  }

  /**
   * @param {string} key
   * @param {{ method?: 'GET'|'PUT', expiresIn?: number, contentType?: string }} [options]
   */
  async getSignedUrl(key, { method = 'GET', expiresIn, contentType } = {}) {
    this.#assertPublicKey(key);
    const cmd = method === 'PUT'
      ? new PutObjectCommand({ Bucket: this.#bucket, Key: key, ContentType: contentType })
      : new GetObjectCommand({ Bucket: this.#bucket, Key: key });

    return getSignedUrl(this.#presignClient, cmd, {
      expiresIn: expiresIn ?? (method === 'PUT' ? this.#uploadUrlTtl : this.#viewUrlTtl),
    });
  }

  getPublicUrl(key) {
    this.#assertPublicKey(key);
    return `${this.#publicUrl}/${this.#bucket}/${key}`;
  }

  /**
   * Suy ngược object key từ một URL công khai đã lưu trong CSDL.
   * Trả về null nếu URL không thuộc kho lưu trữ này (ví dụ ảnh tĩnh /images/...).
   */
  keyFromPublicUrl(url) {
    if (typeof url !== 'string') return null;
    const prefix = `${this.#publicUrl}/${this.#bucket}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  /**
   * Đọc nội dung một object thành Buffer.
   *
   * Dùng client nội bộ (endpoint http://minio:9000) chứ không tải qua URL công
   * khai: bên trong container, localhost:9000 trỏ về chính backend chứ không
   * phải MinIO nên tải theo publicUrl sẽ hỏng khi chạy Docker.
   */
  async getObjectBuffer(key) {
    this.#assertPublicKey(key);
    const res = await this.#client.send(new GetObjectCommand({ Bucket: this.#bucket, Key: key }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async delete(key) {
    this.#assertPublicKey(key);
    await this.#client.send(new DeleteObjectCommand({ Bucket: this.#bucket, Key: key }));
  }

  /** Gọi 1 lần lúc khởi động — không gọi theo từng request. */
  async bootstrap() {
    await this.#ensureBucket();
    await this.#ensurePublicReadPolicy();
  }

  async #ensureBucket() {
    try {
      await this.#client.send(new HeadBucketCommand({ Bucket: this.#bucket }));
    } catch {
      try {
        await this.#client.send(new CreateBucketCommand({ Bucket: this.#bucket }));
      } catch (err) {
        if (err.name !== 'BucketAlreadyOwnedByYou' && err.name !== 'BucketAlreadyExists') {
          throw new Error(`Không tạo được bucket "${this.#bucket}": ${err.message}`);
        }
      }
    }
  }

  // Ảnh bài viết hiển thị trực tiếp trên web nên bucket phải cho đọc ẩn danh.
  async #ensurePublicReadPolicy() {
    try {
      await this.#client.send(new PutBucketPolicyCommand({
        Bucket: this.#bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect:    'Allow',
            Principal: { AWS: ['*'] },
            Action:    ['s3:GetObject'],
            Resource:  [`arn:aws:s3:::${this.#bucket}/*`],
          }],
        }),
      }));
    } catch (err) {
      // Service account bị giới hạn quyền → policy do admin đặt sẵn bằng
      // `mc anonymous set download`. Không coi là lỗi khởi động.
      if (err.$metadata?.httpStatusCode === 403 || err.name === 'AccessDenied') return;
      throw err;
    }
  }
}
