import * as productService from './product.service.js';
import { ok, created, noContent } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function list(req, res) {
  const result = await productService.listProducts(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function getById(req, res) {
  const product = await productService.getProductById(req.params.id);
  ok(res, product);
}

export async function listFilters(_req, res) {
  const filters = await productService.getProductFilters();
  ok(res, filters);
}

export async function listFlashSales(_req, res) {
  const items = await productService.listFlashSales();
  ok(res, items);
}

export async function create(req, res) {
  const product = await productService.createProduct(req.body);
  created(res, product, 'Sản phẩm đã được tạo');
}

export async function update(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  ok(res, product, 'Sản phẩm đã được cập nhật');
}

export async function remove(_req, _res) {
  throw new AppError('API xóa sản phẩm đã bị vô hiệu hóa để bảo toàn lịch sử đơn hàng & báo cáo. Vui lòng cập nhật số lượng tồn kho = 0 hoặc ẩn sản phẩm.', 400);
}

export async function listFlashSalesAdmin(req, res) {
  const items = await productService.listFlashSalesAdmin();
  ok(res, items);
}

export async function createFlashSaleAdmin(req, res) {
  const item = await productService.createFlashSale(req.body);
  created(res, item, 'Flash sale đã được tạo');
}

export async function updateFlashSaleAdmin(req, res) {
  const item = await productService.updateFlashSale(req.params.id, req.body);
  ok(res, item, 'Flash sale đã được cập nhật');
}

export async function deleteFlashSaleAdmin(req, res) {
  await productService.deleteFlashSale(req.params.id);
  noContent(res);
}
