import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    chatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatter', required: true },
    date:      { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime:   { type: String, required: true },
    status:    {
      type: String,
      enum: ['pending', 'approved', 'scheduled', 'active', 'completed', 'rejected'],
      default: 'pending',
    },
    clockedIn:  { type: Date },
    clockedOut: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model('Shift', shiftSchema);
