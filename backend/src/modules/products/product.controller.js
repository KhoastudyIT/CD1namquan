import * as productService from './product.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export async function list(req, res) {
  const result = await productService.listProducts(req.query);
  res.status(200).json({ success: true, ...result });
}

export async function getById(req, res) {
  const product = await productService.getProductById(req.params.id);
  ok(res, product);
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

export async function remove(req, res) {
  await productService.deleteProduct(req.params.id);
  noContent(res);
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
