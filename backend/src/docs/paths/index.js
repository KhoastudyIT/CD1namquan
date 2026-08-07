// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

import { authPaths } from './auth.js';
import { productPaths } from './products.js';
import { categoryPaths } from './categories.js';
import { collectionPaths } from './collections.js';
import { newsPaths } from './news.js';
import { cartPaths } from './cart.js';
import { orderPaths } from './orders.js';
import { userPaths } from './users.js';
import { uploadPaths } from './uploads.js';
import { statsPaths } from './stats.js';
import { notificationPaths } from './notifications.js';
import { chatPaths } from './chat.js';

export const paths = {
  ...authPaths,
  ...productPaths,
  ...categoryPaths,
  ...collectionPaths,
  ...newsPaths,
  ...cartPaths,
  ...orderPaths,
  ...userPaths,
  ...uploadPaths,
  ...statsPaths,
  ...notificationPaths,
  ...chatPaths,
};
