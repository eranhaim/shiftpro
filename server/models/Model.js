import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
  platforms: {
    telegram:  { type: Boolean, default: true },
    onlyfans:  { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Model', modelSchema);
