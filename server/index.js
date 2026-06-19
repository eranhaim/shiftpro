import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/auth.js';
import chattersRoutes from './routes/chatters.js';
import modelsRoutes from './routes/models.js';
import shiftsRoutes from './routes/shifts.js';
import shiftAssignmentsRoutes from './routes/shift-assignments.js';
import dailySummariesRoutes from './routes/daily-summaries.js';
import monthlyGoalsRoutes from './routes/monthly-goals.js';
import errorsRoutes from './routes/errors.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chatters', chattersRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/shift-assignments', shiftAssignmentsRoutes);
app.use('/api/daily-summaries', dailySummariesRoutes);
app.use('/api/monthly-goals', monthlyGoalsRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

async function start() {
  let uri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch {
    console.log('External MongoDB not available, starting in-memory server...');
    const mongod = new MongoMemoryServer();
    await mongod.start();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB');

    const { default: seed } = await import('./seed-fn.js');
    await seed();
    console.log('Database seeded automatically');
  }

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
