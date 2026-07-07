import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    chatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatter', required: true },
    date:      { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime:   { type: String, required: true },
    status:    {
      type: String,
      enum: ['pending', 'approved', 'scheduled', 'active', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    rejectReason: { type: String },
    clockedIn:  { type: Date },
    clockedOut: { type: Date },
    reminded:   { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('Shift', shiftSchema);
