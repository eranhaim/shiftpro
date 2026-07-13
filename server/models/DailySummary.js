import mongoose from "mongoose";

const dailySummarySchema = new mongoose.Schema({
  chatterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chatter",
    required: true,
  },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
  date: { type: Date, required: true },
  dayOfWeek: { type: String },
  shiftType: { type: String, enum: ["בוקר", "ערב", "כפולה"] },

  modelPlatformAssignments: [
    {
      modelName: { type: String },
      platforms: [{ type: String }],
    },
  ],

  availabilityStatus: {
    type: String,
    enum: ["full", "partial", "absent"],
    default: "full",
  },
  availabilityGapsDetail: { type: String },

  hasDebts: { type: Boolean, default: false },
  debtsDetail: { type: String },

  hasPendingSales: { type: Boolean, default: false },
  pendingSalesDetail: { type: String },

  hasUnusualEvents: { type: Boolean, default: false },
  unusualEventsDetail: { type: String },

  // Raw values as entered by chatter (original currencies)
  incomeTelegram: { type: Number, default: 0 }, // EUR
  incomeOnlyfans: { type: Number, default: 0 }, // USD
  incomeTransfers: { type: Number, default: 0 }, // ILS (before VAT)
  incomeOther: { type: Number, default: 0 }, // ILS (before VAT)
  incomeTotal: { type: Number, default: 0 },

  // Converted values in USD
  incomeTelegramUSD: { type: Number, default: 0 },
  incomeOnlyfansUSD: { type: Number, default: 0 },
  incomeTransfersUSD: { type: Number, default: 0 },
  incomeOtherUSD: { type: Number, default: 0 },
  incomeTotalUSD: { type: Number, default: 0 },

  // Exchange rates used
  rateEURUSD: { type: Number },
  rateILSUSD: { type: Number },

  allDepositsVerified: { type: Boolean, default: false },

  improvementSuggestions: { type: String },
  contentRequest: { type: String },
  selfImprovementPoint: { type: String },
  selfPreservationPoint: { type: String },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("DailySummary", dailySummarySchema);
