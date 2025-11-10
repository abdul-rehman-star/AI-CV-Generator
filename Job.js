const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    salary: { type: String, default: "" },
    type: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"], default: "Full-time" },
    description: { type: String, required: true },
    postedByEmail: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Job || mongoose.model("Job", JobSchema);



