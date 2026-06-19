import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true },
  displayName: { type: String, required: true, trim: true },
  role:        { type: String, enum: ['admin', 'manager'], default: 'admin' },
  createdAt:   { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
