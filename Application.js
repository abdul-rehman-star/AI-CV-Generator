const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, index: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    applicantId: { type: String, default: null },
    applicantEmail: { type: String, required: true, lowercase: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    coverLetter: { type: String, default: "" },
    status: { type: String, enum: ["Applied", "Screening", "Interview", "Offer", "Rejected"], default: "Applied" },
  },
  { timestamps: true }
);

// Prevent duplicate applications by the same user for the same job
applicationSchema.index({ jobId: 1, applicantEmail: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);





