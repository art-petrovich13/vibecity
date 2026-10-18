import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import metaRoutes from './routes/meta.routes';
import promocodesRoutes from './routes/promocodes.routes';
import reviewsRoutes from './routes/reviews.routes';
import ticketsRoutes from './routes/tickets.routes';
import { errorHandler, notFoundHandler } from './middleware/error';

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vibecity-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/promocodes', promocodesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meta', metaRoutes);

app.use('/api', notFoundHandler);

// В production Express раздаёт собранный React из backend/public.
const publicDir = path.resolve(__dirname, '../public');
const indexHtml = path.join(publicDir, 'index.html');

if (fs.existsSync(indexHtml)) {
  app.use(express.static(publicDir));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(indexHtml);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
