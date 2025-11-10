import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgPost from "../assets/Post.png";

const PostJob = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "Full-time",
    description: "",
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPreview, setAiPreview] = useState(null);

  // Interview scheduling removed from Post Job flow

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleGenerateTest = async () => {
    setAiLoading(true);
    setAiError("");
    setAiPreview(null);
    try {
      const res = await fetch("http://localhost:5000/api/tests/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title || "General" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate questions");
      setAiPreview(data);
    } catch (e) {
      setAiError(e?.message || "Failed to generate questions");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { 
      ...form, 
      postedByEmail: localStorage.getItem("userEmail") || localStorage.getItem("user") || sessionStorage.getItem("userEmail") || sessionStorage.getItem("user") || undefined 
    };
    fetch("http://localhost:5000/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.error || "Failed to post job");
        return r.json();
      })
      .then(async (job) => {
        // If AI preview exists, create the test linked to this job
        if (aiPreview?.questions && aiPreview.questions.length) {
          const companyId = (localStorage.getItem("userEmail") || localStorage.getItem("user") || "company@example.com");
          const body = {
            jobId: job?._id || String(job?.id || ""),
            companyId,
            title: aiPreview.title || `${form.title} Skills Test`,
            description: aiPreview.description || "",
            durationSec: aiPreview.durationSec || 900,
            questions: aiPreview.questions,
          };
          const resp = await fetch("http://localhost:5000/api/tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            console.warn("Failed to create test:", err);
          }
        }

        window.appToast && window.appToast("Job posted successfully!", "success");
        setForm({ title: "", company: "", location: "", salary: "", type: "Full-time", description: "" });
        setAiPreview(null);
        
        // Navigate to Candidate dashboard to see the new job
        setTimeout(() => {
          navigate("/Candidate");
        }, 1000);
      })
      .catch((e) => window.appToast && window.appToast(e.message || "Failed to post job", "error"));
  };

  return (
    <div
      className="min-h-screen p-6 bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: `url(${bgPost})` }}
    >
      <div className="max-w-3xl ml-120 mx-auto bg-[white]  rounded-2xl  md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-black">Post a Job</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} className="w-full border rounded-lg p-3" placeholder="e.g., Senior React Developer" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input value={form.company} onChange={(e) => update("company", e.target.value)} className="w-full border rounded-lg p-3" placeholder="Company name" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input value={form.location} onChange={(e) => update("location", e.target.value)} className="w-full border rounded-lg p-3" placeholder="City, Country" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Salary Range</label>
              <input value={form.salary} onChange={(e) => update("salary", e.target.value)} className="w-full border rounded-lg p-3" placeholder="$3k - $5k" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Job Type</label>
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full border rounded-lg p-3">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
                <option>Remote</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea rows={6} value={form.description} onChange={(e) => update("description", e.target.value)} className="w-full border rounded-lg p-3" placeholder="Describe responsibilities, requirements, and perks" required />
          </div>

          {/* AI Test Section */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Screening Test (Optional)</h2>
              <button
                type="button"
                onClick={handleGenerateTest}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
                disabled={aiLoading || !form.title}
              >
                {aiLoading ? "Generating..." : "Generate Test with AI"}
              </button>
            </div>
            {aiError && <div className="text-red-600 text-sm mt-2">{aiError}</div>}
            {aiPreview?.questions?.length ? (
              <div className="mt-3 space-y-3">
                <div className="text-sm text-gray-600">Title: {aiPreview.title}</div>
                <div className="text-sm text-gray-600">Duration: {(aiPreview.durationSec || 0) / 60} min</div>
                <ol className="list-decimal ml-5 space-y-2">
                  {aiPreview.questions.map((q, idx) => (
                    <li key={idx} className="text-sm text-gray-800">
                      <div className="font-medium">{q.text}</div>
                      <ul className="list-disc ml-5 text-gray-600">
                        {q.options.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="text-sm text-gray-500 mt-2">No test generated yet.</div>
            )}
          </div>

          {/* Interview scheduling removed from Post Job */}

          <div className="pt-2">
            <button type="submit" className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Publish Job</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;



