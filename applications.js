const express = require("express");
const Application = require("../models/Application");

const router = express.Router();

// Create application
router.post("/", async (req, res) => {
  try {
    const {
      jobId,
      jobTitle,
      company,
      applicantId,
      applicantEmail,
      applicantName,
      phone,
      resumeUrl,
      coverLetter,
    } = req.body || {};

    if (!jobId || !jobTitle || !company || !applicantEmail || !applicantName) {
      return res.status(400).json({ error: "jobId, jobTitle, company, applicantEmail, applicantName required" });
    }

    let created;
    try {
      created = await Application.create({
      jobId,
      jobTitle,
      company,
      applicantId: applicantId || null,
      applicantEmail: String(applicantEmail).toLowerCase().trim(),
      applicantName,
      phone: phone || "",
      resumeUrl: resumeUrl || "",
      coverLetter: coverLetter || "",
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ error: "You have already applied to this job" });
      }
      throw err;
    }

    res.status(201).json(created);
  } catch (e) {
    console.error("Create application error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List applications for a user by email
router.get("/by-user", async (req, res) => {
  try {
    const email = String(req.query.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "email is required" });
    const apps = await Application.find({ applicantEmail: email }).sort({ createdAt: -1 }).lean();
    res.json(apps);
  } catch (e) {
    console.error("List applications error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Count applicants for a set of jobIds
router.get("/by-jobs", async (req, res) => {
  try {
    const ids = String(req.query.jobIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return res.status(400).json({ error: "jobIds required" });
    const apps = await Application.find({ jobId: { $in: ids } }).lean();
    const counts = {};
    apps.forEach((a) => {
      counts[a.jobId] = (counts[a.jobId] || 0) + 1;
    });
    res.json({ counts, total: apps.length });
  } catch (e) {
    console.error("Applicants by jobs error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Return full applications for a list of jobIds
router.get("/list-by-jobs", async (req, res) => {
  try {
    const ids = String(req.query.jobIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return res.status(400).json({ error: "jobIds required" });
    const apps = await Application.find({ jobId: { $in: ids } }).sort({ createdAt: -1 }).lean();
    res.json(apps);
  } catch (e) {
    console.error("List applications by jobs error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
 





