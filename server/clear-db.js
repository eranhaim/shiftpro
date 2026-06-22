import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
const colls = await mongoose.connection.db.listCollections().toArray();
for (const c of colls) {
  await mongoose.connection.db.dropCollection(c.name);
  console.log('dropped', c.name);
}
console.log('Database cleared');
process.exit(0);
