import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    chatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatter' },
    message: { type: String, required: true },
    type: { type: String, enum: ['general', 'shift', 'summary', 'payment'], default: 'general' },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export default mongoose.model('Reminder', reminderSchema);
