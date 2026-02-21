import { Router } from 'express';
import mercadopagoRouter from './mercadopago.js';

export const apiRouter = Router();

apiRouter.get('/example', (_req, res) => {
  res.json({ message: 'API backend funcionando', timestamp: new Date().toISOString() });
});

apiRouter.use('/mercadopago', mercadopagoRouter);
