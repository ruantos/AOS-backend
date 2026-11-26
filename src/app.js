import express from 'express';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(notFound);
app.use(errorHandler);

export default app;
