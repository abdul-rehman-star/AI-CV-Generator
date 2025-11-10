import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const InterviewManagement = () => {
  const location = useLocation();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [jobInfo, setJobInfo] = useState(null);

  // Read jobId from query string (?jobId=...)
  const jobId = useMemo(() => {
    try {
      const qs = new URLSearchParams(location.search);
      return qs.get("jobId");
    } catch {
      return null;
    }
  }, [location.search]);

  // Fetch interview schedule for the job
  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    setError("");
    fetch(`/api/interviews/by-job/${jobId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.error || "Failed to load interview");
        return r.json();
      })
      .then((data) => setInterview(data))
      .catch((e) => setError(e?.message || "Failed to load interview"))
      .finally(() => setLoading(false));
  }, [jobId]);

  // Load job/company info to display context
  useEffect(() => {
    const loadJob = async () => {
      try {
        const r = await fetch(`/api/jobs`);
        const arr = await r.json().catch(() => []);
        const found = Array.isArray(arr) ? arr.find(j => (j._id || j.id) === jobId) : null;
        if (found) setJobInfo(found);
      } catch { setJobInfo((j) => j); }
    };
    if (jobId) loadJob();
  }, [jobId]);

  // Display helpers
  const interviewTimeLabel = useMemo(() => {
    if (!interview?.scheduledAt) return "";
    try {
      const d = new Date(interview.scheduledAt);
      const dateStr = d.toLocaleDateString();
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `${dateStr} at ${timeStr}`;
    } catch {
      return "";
    }
  }, [interview]);

  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId") || undefined;
  const email = localStorage.getItem("userEmail") || localStorage.getItem("user") || undefined;

  const acceptInterview = () => {
    if (!jobId) return;
    fetch(`/api/interviews/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, userId, email }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.error || "Failed to accept interview");
        return r.json();
      })
      .then((data) => {
        setInterview(data);
        setAccepted(true);
        window.appToast && window.appToast("Interview accepted. You can join at the scheduled time.", "success");
      })
      .catch((e) => window.appToast && window.appToast(e?.message || "Failed to accept interview", "error"));
  };

  const rejectInterview = () => {
    if (!jobId) return;
    fetch(`/api/interviews/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, userId, email }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.error || "Failed to reject interview");
        return r.json();
      })
      .then((data) => {
        setInterview(data);
        setAccepted(false);
        window.appToast && window.appToast("Interview rejected.", "warn");
      })
      .catch((e) => window.appToast && window.appToast(e?.message || "Failed to reject interview", "error"));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 md:p-8">
        <h1 className="text-3xl font-bold text-black mb-2">Interview Details</h1>
        {jobId && <p className="text-sm text-gray-600 mb-4">Job ID: {jobId}</p>}
        {jobInfo && (
          <div className="mb-4 text-sm text-gray-700">
            <div><span className="font-semibold">Job:</span> {jobInfo.title}</div>
            <div><span className="font-semibold">Company:</span> {jobInfo.company}</div>
          </div>
        )}
        {loading && <p className="text-gray-600">Loading interview...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && !interview && (
          <div className="text-gray-700">No interview scheduled for this job yet.</div>
        )}

        {interview && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900">{interview.title}</div>
              <div className="text-gray-700 mt-1">Time: {interviewTimeLabel || "—"}</div>
              <div className="text-gray-700">Location: {interview.location || "Online"}</div>
              {interview.meetingLink && (
                <div className="text-gray-700 break-all">Meeting: {interview.meetingLink}</div>
              )}
              {interview.googleAddUrl && (
                <div className="mt-2">
                  <a className="text-indigo-600 hover:text-indigo-800 underline" href={interview.googleAddUrl} target="_blank" rel="noreferrer">
                    Add to Google Calendar
                  </a>
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={acceptInterview}
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Accept
                </button>
                <button
                  onClick={rejectInterview}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
                >
                  Reject
                </button>
                <a
                  href={accepted && interview.meetingLink ? interview.meetingLink : undefined}
                  target={accepted && interview.meetingLink ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`px-4 py-2 rounded text-white ${accepted && interview.meetingLink ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
                >
                  Join Meet
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewManagement;


