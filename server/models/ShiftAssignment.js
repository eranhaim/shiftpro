import mongoose from 'mongoose';

const shiftAssignmentSchema = new mongoose.Schema({
  shiftId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  modelId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
  modelName:      { type: String, required: true },
  platform:       { type: String, enum: ['telegram', 'onlyfans'], required: true },
  shiftDate:      { type: Date },
  shiftStartTime: { type: String },
  assignedAt:     { type: Date, default: Date.now },
});

export default mongoose.model('ShiftAssignment', shiftAssignmentSchema);
