const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, token });
  } catch (e) {
    console.error("Signup error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // If user was created via Google OAuth, there may be no local password set
    if (!user.passwordHash) {
      return res.status(400).json({
        error:
          "This account does not have a password set. Please sign in with Google or reset your password.",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ id: user._id, name: user.name, email: user.email, token });
  } catch (e) {
    console.error("Login error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot Password - verify email exists
router.post("/forgot-verify", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) return res.status(404).json({ error: "Email not found" });

    // For now, we don't send email; frontend will proceed to set a new password
    return res.json({ ok: true });
  } catch (e) {
    console.error("Forgot verify error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password directly after verification (simple flow without email token)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ error: "email and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: "Email not found" });

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.passwordHash = passwordHash;
    await user.save();

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (e) {
    console.error("Reset password error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;


