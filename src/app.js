import express from 'express';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import deliveryRoutes, { orderDeliveryRoutes } from './routes/deliveryRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(trackingRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/deliveries', deliveryRoutes);
app.use('/orders/:orderId/delivery', orderDeliveryRoutes);
app.use('/orders', orderRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
