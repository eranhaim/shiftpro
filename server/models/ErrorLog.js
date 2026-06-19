import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  message:   { type: String },
  stack:     { type: String },
  source:    { type: String },
  level:     { type: String, enum: ['error', 'warning', 'info'], default: 'error' },
  resolved:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ErrorLog', errorLogSchema);
