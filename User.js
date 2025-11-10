const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Common
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Local auth
    passwordHash: { type: String, required: false, default: null },

    // OAuth (Google)
    googleId: { type: String, required: false, index: true, unique: false },
    avatarUrl: { type: String, required: false, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);


