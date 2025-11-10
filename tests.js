const express = require("express");
const Test = require("../models/Test");
const TestResult = require("../models/TestResult");
const axios = require("axios");

const router = express.Router();

// Create a test (company)
router.post("/", async (req, res) => {
  try {
    const { jobId, companyId, title, description, durationSec, questions } = req.body || {};
    if (!jobId || !companyId || !title || !durationSec || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "jobId, companyId, title, durationSec, questions required" });
    }
    const test = await Test.create({ jobId, companyId, title, description, durationSec, questions });
    res.status(201).json(test);
  } catch (e) {
    console.error("Create test error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List tests by companyId
router.get("/by-company/:companyId", async (req, res) => {
  try {
    const list = await Test.find({ companyId: req.params.companyId }).lean();
    res.json(list);
  } catch (e) {
    console.error("List tests by company error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get test by jobId (public)
router.get("/by-job/:jobId", async (req, res) => {
  try {
    const test = await Test.findOne({ jobId: req.params.jobId, isActive: true }).lean();
    if (!test) return res.status(404).json({ error: "No test for this job" });
    // Hide correct answers
    const safe = {
      _id: test._id,
      jobId: test.jobId,
      companyId: test.companyId,
      title: test.title,
      description: test.description,
      durationSec: test.durationSec,
      questions: test.questions.map((q) => ({ text: q.text, options: q.options })),
    };
    res.json(safe);
  } catch (e) {
    console.error("Fetch test error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit result
router.post("/submit", async (req, res) => {
  try {
    const { testId, jobId, userId, answers, timeTaken } = req.body || {};
    if (!testId || !jobId || !userId || !answers) return res.status(400).json({ error: "Missing fields" });
    const test = await Test.findById(testId).lean();
    if (!test) return res.status(404).json({ error: "Test not found" });

    let score = 0;
    test.questions.forEach((q, idx) => {
      const qid = idx + 1; // client will send 1-based ids or indices
      const chosen = answers[qid];
      if (typeof chosen === "number" && chosen === q.answerIndex) score += 1;
    });

    const result = await TestResult.create({
      jobId,
      testId: test._id,
      userId,
      score,
      total: test.questions.length,
      timeTaken: Number(timeTaken) || 0,
      answers,
    });

    res.status(201).json(result);
  } catch (e) {
    console.error("Submit result error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List passed candidates for a company's jobs (>=80%) with minimal info
router.get("/passed/by-company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    // Find tests created by this company
    const tests = await Test.find({ companyId }).lean();
    const testIds = tests.map(t => t._id);
    if (!testIds.length) return res.json([]);
    // Results that passed
    const results = await TestResult.find({ testId: { $in: testIds } }).lean();
    const passed = results.filter(r => r.total > 0 && (r.score / r.total) * 100 >= 80);
    res.json(passed);
  } catch (e) {
    console.error("List passed candidates error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate questions from job title using OpenAI (with mock fallback)
router.post("/generate-questions", async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: "title is required" });

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Mock questions when no API key configured
      return res.json({
        questions: [
          {
            text: `What is the primary responsibility of a ${title}?`,
            options: ["Write code", "Bake cakes", "Drive buses", "Paint houses"],
            answerIndex: 0,
          },
          {
            text: `Which tool is commonly used by a ${title}?`,
            options: ["React", "Oven", "Steering wheel", "Hammer"],
            answerIndex: 0,
          },
          {
            text: `How do you measure success for a ${title}?`,
            options: ["Feature delivery", "Cake taste", "Miles driven", "Walls painted"],
            answerIndex: 0,
          },
        ],
        durationSec: 600,
        title: `${title} Skills Test`,
        description: `Auto-generated screening test for ${title}`,
      });
    }

    const prompt = `Create exactly 5 multiple-choice screening questions for the job title: "${title}".
For each question return JSON with fields: text (string), options (array of 4 plausible choices), answerIndex (0-3 correct option index).
Return ONLY valid JSON: { "questions": [...], "durationSec": 900, "title": "${title} Skills Test", "description": "Auto-generated screening test for ${title}" }`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You generate structured JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        timeout: 25000,
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback: try to extract JSON block
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(502).json({ error: "Failed to generate questions" });
    }

    return res.json(parsed);
  } catch (e) {
    console.error("Generate questions error", e?.response?.data || e?.message || e);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;



