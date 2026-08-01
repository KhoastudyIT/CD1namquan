import 'dotenv/config';
import { createApp } from './app.js';
import config from './config/index.js';
import { bootstrapStorage } from './services/storage/index.js';

const app = createApp();

// Tạo bucket nếu chưa có. Không chặn việc listen — MinIO chưa chạy thì các API
// khác vẫn phục vụ bình thường, chỉ upload ảnh là chưa dùng được.
await bootstrapStorage();

const server = app.listen(config.port, () => {
  console.log('');
  console.log('NAM QUAN Backend');
  console.log(`  Server   : http://localhost:${config.port}`);
  console.log(`  API Docs : http://localhost:${config.port}/api-docs`);
  console.log(`  Health   : http://localhost:${config.port}/api/health`);
  console.log('');
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
