import * as productService from './product.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export function list(req, res) {
  const result = productService.listProducts(req.query);
  res.status(200).json({ success: true, ...result });
}

export function getById(req, res) {
  const product = productService.getProductById(req.params.id);
  ok(res, product);
}

export function listFlashSales(_req, res) {
  const items = productService.listFlashSales();
  ok(res, items);
}

export function create(req, res) {
  const product = productService.createProduct(req.body);
  created(res, product, 'Sản phẩm đã được tạo');
}

export function update(req, res) {
  const product = productService.updateProduct(req.params.id, req.body);
  ok(res, product, 'Sản phẩm đã được cập nhật');
}

export function remove(req, res) {
  productService.deleteProduct(req.params.id);
  noContent(res);
}
