const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, index: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    userId: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    timeTaken: { type: Number, required: true },
    answers: { type: Object, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestResult", testResultSchema);



