const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    durationSec: { type: Number, required: true },
    questions: [
      {
        text: { type: String, required: true },
        options: { type: [String], required: true, validate: v => Array.isArray(v) && v.length >= 2 },
        answerIndex: { type: Number, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);



