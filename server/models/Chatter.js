import mongoose from 'mongoose';
import crypto from 'crypto';

const chatterSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    phone:        { type: String, trim: true },
    email:        { type: String, trim: true },
    password:     { type: String },
    rawPassword:  { type: String },
    token:        { type: String, unique: true, default: () => crypto.randomBytes(16).toString('hex') },
    active:       { type: Boolean, default: true },
    bonusTier:    { type: String, enum: ['A', 'B', 'C', null], default: null },
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastSignInAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model('Chatter', chatterSchema);
