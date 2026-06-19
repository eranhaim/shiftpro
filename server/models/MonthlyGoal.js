import mongoose from 'mongoose';

const monthlyGoalSchema = new mongoose.Schema({
  chatterId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Chatter', required: true },
  month:      { type: String, required: true },
  goalAmount: { type: Number, default: 0 },
  createdAt:  { type: Date, default: Date.now },
});

export default mongoose.model('MonthlyGoal', monthlyGoalSchema);
