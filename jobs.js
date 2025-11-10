const express = require("express");
const Job = require("../models/Job");

const router = express.Router();

// Create a job
router.post("/", async (req, res) => {
  try {
    const { title, company, location, salary, type, description, postedByEmail } = req.body || {};
    if (!title || !company || !location || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const job = await Job.create({ title, company, location, salary, type, description, postedByEmail });
    res.status(201).json(job);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to create job" });
  }
});

// List jobs (basic)
router.get("/", async (_req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to fetch jobs" });
  }
});

module.exports = router;




