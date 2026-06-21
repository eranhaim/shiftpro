import mongoose from 'mongoose';

const dailySummarySchema = new mongoose.Schema({
  chatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatter', required: true },
  shiftId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  date:      { type: Date, required: true },
  dayOfWeek: { type: String },
  shiftType: { type: String, enum: ['בוקר', 'ערב', 'כפולה'] },

  modelPlatformAssignments: [
    {
      modelName: { type: String },
      platforms: [{ type: String }],
    },
  ],

  availabilityStatus:    { type: String, enum: ['full', 'partial', 'absent'], default: 'full' },
  availabilityGapsDetail: { type: String },

  hasDebts:    { type: Boolean, default: false },
  debtsDetail: { type: String },

  hasPendingSales:    { type: Boolean, default: false },
  pendingSalesDetail: { type: String },

  hasUnusualEvents:    { type: Boolean, default: false },
  unusualEventsDetail: { type: String },

  incomeTelegram:  { type: Number, default: 0 },
  incomeOnlyfans:  { type: Number, default: 0 },
  incomeTransfers: { type: Number, default: 0 },
  incomeOther:     { type: Number, default: 0 },
  incomeTotal:     { type: Number, default: 0 },

  allDepositsVerified: { type: Boolean, default: false },

  improvementSuggestions:  { type: String },
  contentRequest:          { type: String },
  selfImprovementPoint:    { type: String },
  selfPreservationPoint:   { type: String },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('DailySummary', dailySummarySchema);
