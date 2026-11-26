import express from 'express';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
