// @ts-nocheck
// backend/src/server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

dotenv.config();

const app = express();
let port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI || "";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const User = require("./models/User");
          const primaryEmail = profile?.emails?.[0]?.value?.toLowerCase?.();
          const displayName = profile?.displayName || primaryEmail || "User";
          const avatarUrl = profile?.photos?.[0]?.value || null;

          if (!primaryEmail) {
            // Email may be missing if scope doesn't include it or Google account hidden
            return done(new Error("Google profile missing email"));
          }

          console.log("[OAuth] Google callback for:", primaryEmail);
          let user = await User.findOne({ email: primaryEmail });
          if (!user) {
            console.log("[OAuth] Creating new user for", primaryEmail);
            user = await User.create({
              name: displayName,
              email: primaryEmail,
              googleId: profile.id,
              avatarUrl,
            });
          } else {
            // Update Google data if changed
            const updates = {};
            if (!user.googleId) updates.googleId = profile.id;
            if (avatarUrl && user.avatarUrl !== avatarUrl) updates.avatarUrl = avatarUrl;
            if (displayName && user.name !== displayName) updates.name = displayName;
            if (Object.keys(updates).length) {
              console.log("[OAuth] Updating user", primaryEmail, updates);
              await User.updateOne({ _id: user._id }, { $set: updates });
              user = await User.findById(user._id).lean();
            }
          }

          return done(null, {
            id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          });
        } catch (e) {
          console.error("[OAuth] Error in Google callback:", e?.message || e);
          return done(e);
        }
      }
    )
  );
}

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    res.redirect("/auth/success");
  }
);

app.get("/auth/success", (req, res) => {
  if (!req.user) return res.status(401).json({ authenticated: false });
  // Redirect to frontend welcome page with minimal info (or send JSON)
  const redirectUrl = process.env.FRONTEND_WELCOME_URL || "http://localhost:5173/welcome";
  try {
    const params = new URLSearchParams({
      id: String(req.user.id || ""),
      name: String(req.user.name || ""),
      email: String(req.user.email || ""),
    });
    return res.redirect(`${redirectUrl}?${params.toString()}`);
  } catch {
    return res.json({ authenticated: true, user: req.user });
  }
});

app.get("/auth/failure", (req, res) => {
  res.status(401).json({ authenticated: false, error: "Google authentication failed" });
});

// Auth routes (email/password)
app.use("/api/auth", require("./routes/auth"));
// Tests routes
app.use("/api/tests", require("./routes/tests"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/interviews", require("./routes/interviews"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "rozgaar-backend", timestamp: Date.now() });
});

// DB status endpoint
app.get("/api/db-status", (req, res) => {
  const state = mongoose.connection?.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  res.json({
    connected: state === 1,
    state,
  });
});

// CORS preflight for CV generation (prevents proxies from returning 501 on OPTIONS)
app.options("/api/generate-cv", cors());

// Helpful fallback for accidental GETs
app.get("/api/generate-cv", (req, res) => {
  res.status(405).json({ error: "Method Not Allowed. Use POST." });
});

app.post("/api/generate-cv", async (req, res) => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  // Debug logging
  console.log("=== CV Generation Request ===");
  console.log("OpenAI API Key present:", !!openaiApiKey);
  console.log("API Key starts with 'sk-':", openaiApiKey?.startsWith('sk-'));
  console.log("API Key starts with 'sk-proj-':", openaiApiKey?.startsWith('sk-proj-'));
  console.log("API Key length:", openaiApiKey?.length || 0);

  // Extract request body outside try so it's available in catch blocks too
  const { profile, customNotes } = req.body || {};

  try {
    if (!profile) {
      return res.status(400).json({ error: "Missing profile in request body" });
    }

    // Debug: Log the profile data being sent to GPT
    console.log("=== Profile Data Received ===");
    console.log("Profile structure:", Object.keys(profile));
    console.log("Personal Info:", profile.personalInfo);
    console.log("Education:", profile.education);
    console.log("Work Experience:", profile.workExperience);
    console.log("Skills:", profile.skills);
    console.log("Custom Notes:", customNotes);

    const prompt = `You are an expert CV writer specializing in professional, modern CV layouts. Create a beautifully formatted, ATS-friendly CV based on the provided data.

CRITICAL INSTRUCTIONS:
- Use ONLY the actual data provided in the JSON below
- Do NOT use placeholder text like "[Insert...]", "Currently, there is no...", or "Please consider adding..."
- If a section has data, use it exactly as provided
- If a section is empty or missing, simply omit that section entirely
- Create a professional, ready-to-use CV with modern styling

LAYOUT REQUIREMENTS:
- Create a two-column layout with left sidebar and main content area
- Left sidebar: Personal info, skills, certifications, education
- Main content: Professional summary, work experience
- Use professional colors and clean typography
- Make it visually appealing and well-structured

HTML STRUCTURE:
Return clean HTML with this exact structure:

<div class="cv-container" style="display: flex; max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;">
  
  <!-- Left Sidebar -->
  <div class="cv-sidebar" style="width: 35%; background: #000000; color: white; padding: 30px 25px; min-height: 100vh;">
    <style>
      .cv-sidebar, .cv-sidebar * { color: #ffffff !important; border-color: rgba(255,255,255,0.3) !important; }
    </style>
    
    <!-- Header with Name -->
    <div class="cv-header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">[NAME]</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 500; opacity: 0.9;">[JOB_TITLE]</p>
    </div>
    
    <!-- Personal Info -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.7); padding-bottom: 8px;">Personal Info</h3>
      <div style="font-size: 13px; line-height: 1.8;">
        <p style="margin: 5px 0;"><strong>Email:</strong><br>[EMAIL]</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong><br>[PHONE]</p>
      </div>
    </div>
    
    <!-- Skills -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.7); padding-bottom: 8px;">Skills</h3>
      <div style="font-size: 13px;">
        [SKILLS_LIST]
      </div>
    </div>
    
    <!-- Education -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.7); padding-bottom: 8px;">Education</h3>
      <div style="font-size: 13px; line-height: 1.6;">
        [EDUCATION_CONTENT]
      </div>
    </div>
    
    <!-- Certifications -->
    <div class="cv-section">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.7); padding-bottom: 8px;">Certifications</h3>
      <div style="font-size: 13px; line-height: 1.6;">
        [CERTIFICATIONS_CONTENT]
      </div>
    </div>
    
  </div>
  
  <!-- Main Content -->
  <div class="cv-main" style="width: 65%; padding: 30px 35px; background: white;">
    <style>.cv-main a{color:#000000;text-decoration:none}</style>
    
    <!-- Professional Summary -->
    <div class="cv-section" style="margin-bottom: 35px;">
      <h2 style="font-size: 22px; font-weight: 800; color: #000000; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #000000; padding-bottom: 8px;">Professional Summary</h2>
      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #555; text-align: justify;">
        [PROFESSIONAL_SUMMARY]
      </p>
    </div>
    
    <!-- Work Experience -->
    <div class="cv-section">
      <h2 style="font-size: 22px; font-weight: 800; color: #000000; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #000000; padding-bottom: 8px;">Work Experience</h2>
      [WORK_EXPERIENCE_CONTENT]
    </div>
    
    <!-- Programming Languages (if applicable) -->
    <div class="cv-section" style="margin-top: 35px;">
      <h2 style="font-size: 22px; font-weight: 800; color: #000000; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #000000; padding-bottom: 8px;">Programming Languages</h2>
      [PROGRAMMING_LANGUAGES]
    </div>
    
  </div>
  
</div>

CONTENT REPLACEMENT RULES:
- Replace [NAME] with the person's full name in UPPERCASE
- Replace [JOB_TITLE] with their current role or desired position
- Replace [EMAIL] with their email address
- Replace [PHONE] with their phone number
- Replace [SKILLS_LIST] with skills formatted as badges or bullet points
- Replace [EDUCATION_CONTENT] with degree, institution, and year in structured format
- Replace [CERTIFICATIONS_CONTENT] with certifications list
- Replace [PROFESSIONAL_SUMMARY] with a compelling 2-3 line professional summary
- Replace [WORK_EXPERIENCE_CONTENT] with properly formatted work history
- Replace [PROGRAMMING_LANGUAGES] with technical skills if applicable

FORMAT WORK EXPERIENCE like this:
<div style="margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #e0e0e0;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
    <h3 style="font-size: 18px; font-weight: 700; color: #333; margin: 0; text-transform: capitalize;">[POSITION]</h3>
    <span style="font-size: 13px; color: #667eea; font-weight: 700; background: #f0f4ff; padding: 4px 12px; border-radius: 20px;">[DURATION]</span>
  </div>
  <p style="font-size: 16px; color: #667eea; font-weight: 600; margin: 0 0 15px 0;">[COMPANY_NAME]</p>
  <ul style="margin: 0; padding-left: 0; list-style: none;">
    <li style="margin-bottom: 8px; padding-left: 20px; position: relative; font-size: 14px; color: #555; line-height: 1.6;">
      <span style="position: absolute; left: 0; top: 8px; width: 6px; height: 6px; background: #667eea; border-radius: 50%;"></span>
      [RESPONSIBILITY_1]
    </li>
    <li style="margin-bottom: 8px; padding-left: 20px; position: relative; font-size: 14px; color: #555; line-height: 1.6;">
      <span style="position: absolute; left: 0; top: 8px; width: 6px; height: 6px; background: #667eea; border-radius: 50%;"></span>
      [RESPONSIBILITY_2]
    </li>
    <li style="margin-bottom: 8px; padding-left: 20px; position: relative; font-size: 14px; color: #555; line-height: 1.6;">
      <span style="position: absolute; left: 0; top: 8px; width: 6px; height: 6px; background: #667eea; border-radius: 50%;"></span>
      [RESPONSIBILITY_3]
    </li>
  </ul>
</div>

FORMAT SKILLS in sidebar like this:
<div style="display: flex; flex-wrap: wrap; gap: 6px;">
  <span style="background: rgba(255,255,255,0.25); padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; border: 1px solid rgba(255,255,255,0.3);">[SKILL]</span>
</div>

FORMAT PROGRAMMING LANGUAGES like this:
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0;">
    <span style="font-size: 14px; font-weight: 600; color: #333;">[LANGUAGE]</span>
    <div style="display: flex; gap: 3px;">
      <span style="width: 12px; height: 12px; background: #667eea; border-radius: 50%;"></span>
      <span style="width: 12px; height: 12px; background: #667eea; border-radius: 50%;"></span>
      <span style="width: 12px; height: 12px; background: #667eea; border-radius: 50%;"></span>
      <span style="width: 12px; height: 12px; background: #667eea; border-radius: 50%;"></span>
      <span style="width: 12px; height: 12px; background: #ddd; border-radius: 50%;"></span>
    </div>
  </div>
</div>

IMPORTANT FORMATTING GUIDELINES:
- Use proper spacing and margins for better readability
- Make work experience section more prominent with better typography
- Add visual elements like dots and badges for better design
- Ensure consistent color scheme throughout
- Make text hierarchy clear with appropriate font sizes

User data (JSON):\n${JSON.stringify(profile, null, 2)}\n\nAdditional notes from user (optional): ${customNotes || ""}`;

    // If no OpenAI key, return a detailed error message
    if (!openaiApiKey) {
      console.log("OpenAI API key not found or invalid. Please set OPENAI_API_KEY in your environment variables.");
      return res.status(500).json({ 
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable to generate CVs with GPT.",
        mock: true,
        text: `<div class="cv-container" style="display: flex; max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;">
  
  <!-- Left Sidebar -->
  <div class="cv-sidebar" style="width: 35%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 25px; min-height: 500px;">
    
    <!-- Header with Name -->
    <div class="cv-header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${profile?.personalInfo?.name || "Professional Name"}</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 500; opacity: 0.9;">${profile?.workExperience?.role || "Professional"}</p>
    </div>
    
    <!-- Personal Info -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Personal Info</h3>
      <div style="font-size: 13px; line-height: 1.8;">
        <p style="margin: 5px 0;"><strong>Email:</strong><br>${profile?.personalInfo?.email || "email@example.com"}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong><br>${profile?.personalInfo?.phone || "+92-XXX-XXXXXXX"}</p>
      </div>
    </div>
    
    <!-- Skills -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Skills</h3>
      <div style="font-size: 13px;">
        <p style="margin: 0;">${profile?.skills?.skillset || "Communication, Teamwork, Problem Solving, Leadership"}</p>
      </div>
    </div>
    
    <!-- Education -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Education</h3>
      <div style="font-size: 13px; line-height: 1.6;">
        <p style="margin: 0; font-weight: 600;">${profile?.education?.degree || "Bachelor's Degree"}</p>
        <p style="margin: 2px 0; opacity: 0.9;">${profile?.education?.institution || "University Name"}</p>
        <p style="margin: 2px 0; opacity: 0.8;">${profile?.education?.year || "2024"}</p>
      </div>
    </div>
    
    <!-- Certifications -->
    <div class="cv-section">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Certifications</h3>
      <div style="font-size: 13px; line-height: 1.6;">
        <p style="margin: 0;">${profile?.skills?.certifications || "Professional Certifications"}</p>
      </div>
    </div>
    
  </div>
  
  <!-- Main Content -->
  <div class="cv-main" style="width: 65%; padding: 30px 35px; background: white;">
    
    <!-- Professional Summary -->
    <div class="cv-section" style="margin-bottom: 35px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #667eea; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Professional Summary</h2>
      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #555; text-align: justify;">
        Dynamic and results-oriented professional with a strong commitment to excellence and a passion for continuous improvement. Experienced in delivering high-quality work and contributing to team success.
      </p>
    </div>
    
    <!-- Work Experience -->
    <div class="cv-section">
      <h2 style="font-size: 18px; font-weight: 700; color: #667eea; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Work Experience</h2>
      
      <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #333; margin: 0;">${profile?.workExperience?.role || "Professional Role"}</h3>
          <span style="font-size: 12px; color: #667eea; font-weight: 600;">${profile?.workExperience?.years || "1-2"} Years</span>
        </div>
        <p style="font-size: 14px; color: #667eea; font-weight: 600; margin: 0 0 10px 0;">${profile?.workExperience?.company || "Company Name"}</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #555;">
          <li style="margin-bottom: 5px;">Contributed to team projects and delivered high-quality results</li>
          <li style="margin-bottom: 5px;">Gained valuable experience in professional environment</li>
          <li style="margin-bottom: 5px;">Developed strong problem-solving and communication skills</li>
        </ul>
      </div>
      
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background: #f8f9ff; border-left: 4px solid #667eea; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 12px; color: #667eea; font-weight: 600;">⚠️ MOCK CV - Configure OpenAI API key for AI-powered generation</p>
    </div>
    
  </div>
  
</div>`
      });
    }

    console.log("Calling OpenAI API...");

    // Retry logic for API calls
    let response;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API attempt ${attempt}/${maxRetries}`);
        
        response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a professional CV writer assistant." },
              { role: "user", content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 2000,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            timeout: 60000, // 60 seconds timeout
          }
        );
        
        // If successful, break out of retry loop
        console.log("OpenAI API response received successfully");
        break;
        
      } catch (apiError) {
        lastError = apiError;
        console.log(`API attempt ${attempt} failed:`, apiError?.code || apiError?.message);
        
        if (attempt < maxRetries) {
          const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all retries failed, throw the last error
    if (!response) {
      throw lastError || new Error("All API retry attempts failed");
    }

    const text = response?.data?.choices?.[0]?.message?.content?.trim?.() || "";
    console.log("Generated CV length:", text.length);
    res.json({ text });
  } catch (err) {
    console.error("OpenAI API Error:", err?.response?.status, err?.response?.data || err?.message);
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: err?.message || "Unknown error" };

    // Return a mock CV with clear info so the frontend can display it
    const errorMessage =
      status === 401
        ? "Invalid OpenAI API key. Please check your API key."
        : status === 429
        ? "OpenAI rate limit reached. Please try again in a moment."
        : err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
        ? "OpenAI API request timed out. Please check your internet connection and try again."
        : err?.code === 'ENOTFOUND' || err?.code === 'ECONNREFUSED'
        ? "Cannot connect to OpenAI API. Please check your internet connection."
        : "Failed to generate CV via OpenAI. Using mock output.";

    return res.status(200).json({
      error: errorMessage,
      mock: true,
      openaiStatus: status,
      openaiError: data,
      text: `<div class=\"cv-container\" style=\"display: flex; max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;\">\n\
  
  <!-- Left Sidebar -->
  <div class="cv-sidebar" style="width: 35%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 25px; min-height: 500px;">
    
    <!-- Header with Name -->
    <div class="cv-header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${profile?.personalInfo?.name || "Professional Name"}</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 500; opacity: 0.9;">${profile?.workExperience?.role || "Professional"}</p>
    </div>
    
    <!-- Personal Info -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Personal Info</h3>
      <div style="font-size: 13px; line-height: 1.8;">
        <p style="margin: 5px 0;"><strong>Email:</strong><br>${profile?.personalInfo?.email || "email@example.com"}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong><br>${profile?.personalInfo?.phone || "+92-XXX-XXXXXXX"}</p>
      </div>
    </div>
    
    <!-- Skills -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Skills</h3>
      <div style="font-size: 13px;">
        <p style="margin: 0;">${profile?.skills?.skillset || "Communication, Teamwork, Problem Solving, Leadership"}</p>
      </div>
    </div>
    
    <!-- Education -->
    <div class="cv-section" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Education</h3>
      <div style="font-size: 13px; line-height: 1.6;">
        <p style="margin: 0; font-weight: 600;">${profile?.education?.degree || "Bachelor's Degree"}</p>
        <p style="margin: 2px 0; opacity: 0.9;">${profile?.education?.institution || "University Name"}</p>
        <p style="margin: 2px 0; opacity: 0.8;">${profile?.education?.year || "2024"}</p>
      </div>
    </div>
    
    <!-- Certifications -->
    <div class="cv-section">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">Certifications</h3>
      <div style="font-size: 13px; line-height: 1.6;">
        <p style="margin: 0;">${profile?.skills?.certifications || "Professional Certifications"}</p>
      </div>
    </div>
    
  </div>
  
  <!-- Main Content -->
  <div class="cv-main" style="width: 65%; padding: 30px 35px; background: white;">
    
    <!-- Professional Summary -->
    <div class="cv-section" style="margin-bottom: 35px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #667eea; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Professional Summary</h2>
      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #555; text-align: justify;">
        Dynamic and results-oriented professional with a strong commitment to excellence and a passion for continuous improvement. Experienced in delivering high-quality work and contributing to team success.
      </p>
    </div>
    
    <!-- Work Experience -->
    <div class="cv-section">
      <h2 style="font-size: 18px; font-weight: 700; color: #667eea; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Work Experience</h2>
      
      <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #333; margin: 0;">${profile?.workExperience?.role || "Professional Role"}</h3>
          <span style="font-size: 12px; color: #667eea; font-weight: 600;">${profile?.workExperience?.years || "1-2"} Years</span>
        </div>
        <p style="font-size: 14px; color: #667eea; font-weight: 600; margin: 0 0 10px 0;">${profile?.workExperience?.company || "Company Name"}</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #555;">
          <li style="margin-bottom: 5px;">Contributed to team projects and delivered high-quality results</li>
          <li style="margin-bottom: 5px;">Gained valuable experience in professional environment</li>
          <li style="margin-bottom: 5px;">Developed strong problem-solving and communication skills</li>
        </ul>
      </div>
      
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 12px; color: #f44336; font-weight: 600;">⚠️ MOCK CV - ${errorMessage}</p>
    </div>
    
  </div>
  
  </div>`,
    });
  }
});

// Start server immediately; connect to DB in background with short timeouts
async function start() {
  function tryListen(startPort, attemptsLeft = 5) {
    const server = app
      .listen(startPort, () => {
        port = startPort;
        console.log(`Backend listening on http://localhost:${startPort}`);
      })
      .on("error", (err) => {
        if (err?.code === "EADDRINUSE" && attemptsLeft > 1) {
          const nextPort = startPort + 1;
          console.warn(`Port ${startPort} in use. Trying ${nextPort}...`);
          setTimeout(() => tryListen(nextPort, attemptsLeft - 1), 250);
        } else {
          console.error("Failed to bind server:", err?.message || err);
          process.exit(1);
        }
      });
    return server;
  }

  tryListen(port);

  try {
    if (!mongoUri) {
      console.warn("MONGODB_URI not set. Set it in .env to enable database features.");
      return;
    }

    mongoose
      .connect(mongoUri, {
        dbName: process.env.MONGODB_DB || undefined,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      })
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((e) => {
        console.error("Failed to connect to MongoDB", e?.message || e);
      });
  } catch (e) {
    console.error("Failed to start MongoDB connection", e);
  }
}

start();


