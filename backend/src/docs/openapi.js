// Lớp tài liệu OpenAPI 3.0 - không chứa business logic.
//
// Spec được chẻ theo domain để mỗi mục sửa ở một file riêng, tránh cảnh cả
// nhóm cùng đụng một file 2000 dòng:
//   info.js        - info, servers, tags (thứ tự tag ở đây quyết định thứ tự
//                    mục hiển thị trên sidebar Scalar)
//   components.js  - securitySchemes, schemas, responses dùng chung
//   paths/*.js     - mỗi domain một file, gộp lại ở paths/index.js
import { apiReference } from '@scalar/express-api-reference';
import { meta } from './info.js';
import { components } from './components.js';
import { paths } from './paths/index.js';

export const spec = {
  openapi: '3.0.3',
  ...meta,
  components,
  paths,
};

export function setupDocs(app) {
  // Spec thô cho Postman / Bruno / Insomnia / sinh SDK.
  app.get('/openapi.json', (_req, res) => res.json(spec));

  app.use('/api-docs', apiReference({
    spec: { url: '/openapi.json' },
    pageTitle: 'NAM QUAN - API Docs',
    layout: 'modern',
    // Tài liệu có 12 mục; mở sẵn hết thì sidebar dài và render chậm.
    defaultOpenAllTags: false,
    // Chọn sẵn Bearer để bấm "Test Request" chỉ cần dán token, khỏi phải vào
    // chọn security scheme mỗi lần.
    authentication: { preferredSecurityScheme: 'bearerAuth' },
    // Tắt khung chat AI của Scalar - không liên quan tới nút Test Request,
    // nút đó do `hideTestRequestButton` điều khiển và mặc định đã bật.
    agent: { disabled: true },
  }));
}
