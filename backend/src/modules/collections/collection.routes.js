import { Router } from 'express';
import * as collectionController from './collection.controller.js';

export const collectionRouter = Router();

collectionRouter.get('/', collectionController.list);
