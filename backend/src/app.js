import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

import config from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupDocs } from './docs/openapi.js';

import { authRouter }       from './modules/auth/auth.routes.js';
import { productRouter }    from './modules/products/product.routes.js';
import { categoryRouter }   from './modules/categories/category.routes.js';
import { collectionRouter } from './modules/collections/collection.routes.js';
import { newsRouter }       from './modules/news/news.routes.js';
import { cartRouter }       from './modules/cart/cart.routes.js';
import { orderRouter }      from './modules/orders/order.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { statsRouter }       from './modules/stats/stats.routes.js';
import { userRouter }        from './modules/user/user.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (config.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );

  const v1 = '/api/v1';
  app.use(`${v1}/auth`,        authRouter);
  app.use(`${v1}/products`,    productRouter);
  app.use(`${v1}/categories`,  categoryRouter);
  app.use(`${v1}/collections`, collectionRouter);
  app.use(`${v1}/news`,        newsRouter);
  app.use(`${v1}/cart`,        cartRouter);
  app.use(`${v1}/orders`,      orderRouter);
  app.use(`${v1}/notifications`, notificationRouter);
  app.use(`${v1}/stats`,         statsRouter);
  app.use(`${v1}/users`,         userRouter);

  if (config.openapiEnabled) setupDocs(app);

  app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));
  app.use(errorHandler);

  return app;
}
