const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, index: true },
    companyId: { type: String, required: true },
    candidateEmail: { type: String, default: null },
    title: { type: String, required: true },
    // ISO datetime string of scheduled interview
    scheduledAt: { type: String, required: true },
    location: { type: String, default: "Online" },
    meetingLink: { type: String, default: "" },
    googleEventId: { type: String, default: "" },
    googleAddUrl: { type: String, default: "" },
    // When a candidate accepts
    acceptedByUserId: { type: String, default: null },
    acceptedByEmail: { type: String, default: null },
    status: { type: String, enum: ["Scheduled", "Accepted", "Completed", "Cancelled"], default: "Scheduled" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);


