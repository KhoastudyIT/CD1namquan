import { Router } from 'express';
import * as newsController from './news.controller.js';

export const newsRouter = Router();

newsRouter.get('/',    newsController.list);
newsRouter.get('/:id', newsController.getById);
