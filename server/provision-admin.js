import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const email = option('--email')?.toLowerCase().trim();
const displayName = option('--name')?.trim();
const password = option('--password') || crypto.randomBytes(18).toString('base64url');

if (!email || !displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node provision-admin.js --email customer@example.com --name "Customer Name" [--password temporary-password]');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  const existing = await User.exists({ email });
  if (existing) {
    console.error(`An account already exists for ${email}. Refusing to replace its password.`);
    console.error('Use the account-reset procedure rather than this provisioning script.');
    process.exitCode = 2;
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({
      email,
      password: hashedPassword,
      displayName,
      role: 'admin',
    });

    console.log(`Admin account created for ${email}`);
    console.log(`Temporary password (show once): ${password}`);
    console.log('Have the customer change this password after their first login.');
  }
} finally {
  await mongoose.disconnect();
}
