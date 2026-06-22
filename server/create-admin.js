import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
const hashed = await bcrypt.hash('elite665', 10);
await User.create({
  email: 'gil@onlyelite.co.il',
  password: hashed,
  displayName: 'Gil Admin',
  role: 'admin',
});
console.log('Admin user created: gil@onlyelite.co.il / elite665');
process.exit(0);
