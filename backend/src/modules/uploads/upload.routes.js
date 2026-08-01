import { Router } from 'express';
import * as uploadController from './upload.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const uploadRouter = Router();

uploadRouter.post('/image-url', authenticate, authorize('admin'), uploadController.getImageUploadUrl);
