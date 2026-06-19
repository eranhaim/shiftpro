import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  chatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatter' },
  action:    { type: String, required: true },
  details:   { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('ActivityLog', activityLogSchema);
