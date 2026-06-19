import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import seed from './seed-fn.js';

async function run() {
  let uri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri);
  } catch {
    console.log('External MongoDB not available, using in-memory server...');
    const mongod = new MongoMemoryServer();
    await mongod.start();
    uri = mongod.getUri();
    await mongoose.connect(uri);
  }

  console.log('Connected to MongoDB');
  await seed();
  console.log('Seed completed!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
