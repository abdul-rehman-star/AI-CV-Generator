const express = require("express");
const Interview = require("../models/Interview");
const axios = require("axios");

const router = express.Router();

// Create or upsert interview schedule per job
router.post("/", async (req, res) => {
  try {
    const { jobId, companyId, title, scheduledAt, location, meetingLink } = req.body || {};
    if (!jobId || !companyId || !title || !scheduledAt) {
      return res.status(400).json({ error: "jobId, companyId, title, scheduledAt required" });
    }
    // Build a Google Calendar quick add URL (user clicks to add manually)
    // Docs: https://developers.google.com/calendar/api/guides/create-events-quickadd
    // Here we use the old "TEMPLATE" URL pattern for simplicity
    // https://calendar.google.com/calendar/u/0/r/eventedit?text=...&dates=YYYYMMDDTHHmmssZ/...
    let googleAddUrl = "";
    try {
      const start = new Date(scheduledAt);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // default 30 min window
      const fmt = (d) =>
        `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;
      const text = encodeURIComponent(`${title}`);
      const details = encodeURIComponent(`Interview for job ${title}${meetingLink ? `\nMeet: ${meetingLink}` : ""}`);
      const locationParam = encodeURIComponent(location || "Online");
      googleAddUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${locationParam}`;
    } catch {}

    const doc = await Interview.findOneAndUpdate(
      { jobId },
      {
        $set: {
          companyId,
          title,
          scheduledAt: String(scheduledAt),
          location: location || "Online",
          meetingLink: meetingLink || "",
          googleEventId: "",
          googleAddUrl,
          status: "Scheduled",
        },
      },
      { new: true, upsert: true }
    );
    res.status(201).json(doc);
  } catch (e) {
    console.error("Create interview error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Explicit schedule endpoint to create interview for specific candidate
router.post("/schedule", async (req, res) => {
  try {
    const { jobId, companyId, candidateEmail, title, scheduledAt, location, meetingLink, mode } = req.body || {};
    if (!jobId || !companyId || !candidateEmail || !title || !scheduledAt) {
      return res.status(400).json({ error: "jobId, companyId, candidateEmail, title, scheduledAt required" });
    }

    let googleAddUrl = "";
    try {
      const start = new Date(scheduledAt);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const fmt = (d) =>
        `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;
      const text = encodeURIComponent(`${title}`);
      const details = encodeURIComponent(`Interview (${mode || 'Online'})${meetingLink ? `\nMeet: ${meetingLink}` : ""}`);
      const locationParam = encodeURIComponent(location || "Online");
      googleAddUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${locationParam}`;
    } catch {}

    const created = await Interview.create({
      jobId,
      companyId,
      candidateEmail: String(candidateEmail).toLowerCase().trim(),
      title,
      scheduledAt: String(scheduledAt),
      location: location || "Online",
      meetingLink: meetingLink || "",
      googleEventId: "",
      googleAddUrl,
      status: "Scheduled",
    });

    res.status(201).json(created);
  } catch (e) {
    console.error("Schedule interview error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get interviews for a candidate by email
router.get("/by-candidate/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase().trim();
    const list = await Interview.find({ candidateEmail: email }).sort({ scheduledAt: 1 }).lean();
    res.json(list);
  } catch (e) {
    console.error("List interviews by candidate error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch interview by jobId
router.get("/by-job/:jobId", async (req, res) => {
  try {
    const interview = await Interview.findOne({ jobId: req.params.jobId }).lean();
    if (!interview) return res.status(404).json({ error: "No interview scheduled for this job" });
    res.json(interview);
  } catch (e) {
    console.error("Fetch interview error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List interviews by companyId
router.get("/by-company/:companyId", async (req, res) => {
  try {
    const list = await Interview.find({ companyId: req.params.companyId }).lean();
    res.json(list);
  } catch (e) {
    console.error("List interviews by company error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Candidate accepts interview
router.post("/accept", async (req, res) => {
  try {
    const { jobId, userId, email } = req.body || {};
    if (!jobId || !(userId || email)) {
      return res.status(400).json({ error: "jobId and user identity required" });
    }
    const interview = await Interview.findOne({ jobId });
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    interview.acceptedByUserId = userId || null;
    interview.acceptedByEmail = email || null;
    interview.status = "Accepted";
    await interview.save();
    res.json(interview);
  } catch (e) {
    console.error("Accept interview error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Candidate rejects interview
router.post("/reject", async (req, res) => {
  try {
    const { jobId, userId, email } = req.body || {};
    if (!jobId || !(userId || email)) {
      return res.status(400).json({ error: "jobId and user identity required" });
    }
    const interview = await Interview.findOne({ jobId });
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    // For simplicity, mark as Cancelled when rejected
    interview.status = "Cancelled";
    await interview.save();
    res.json(interview);
  } catch (e) {
    console.error("Reject interview error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;


