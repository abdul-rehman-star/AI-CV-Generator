import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const SavedJobs = ({ userEmail, onChange }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const effectiveEmail = userEmail || user?.email || "";

  // Fetch saved jobs from backend
  const loadJobs = async () => {
    if (!effectiveEmail) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/saved-jobs?userEmail=${encodeURIComponent(effectiveEmail)}`);
      const data = await res.json();
      const jobList = Array.isArray(data) ? data : [];
      setJobs(jobList);

      // Notify parent about the current count
      if (onChange) onChange(jobList.length);
    } catch (error) {
      console.error("Failed to load saved jobs:", error);
      setJobs([]);
      if (onChange) onChange(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [effectiveEmail]);

  // Remove a saved job
  const handleRemove = async (jobId) => {
    try {
      const res = await fetch("/api/saved-jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: effectiveEmail, jobId }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to remove job:", data.error);
        return;
      }

      // Reload jobs from backend to ensure consistency
      await loadJobs();
    } catch (error) {
      console.error("Failed to remove saved job:", error);
    }
  };

  // Save a job (optional, call this from Job listing)
  const handleSaveJob = async (job) => {
    if (!effectiveEmail || !job._id) return;

    try {
      const res = await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: effectiveEmail, jobId: job._id }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to save job:", data.error);
        return;
      }

      console.log("Job saved:", data.savedJob);
      loadJobs(); // Refresh saved jobs and KPI
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  if (loading) return <div className="text-center py-6">Loading saved jobs...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Saved Jobs</h1>

        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-xl bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="text-lg font-semibold text-gray-900">{item.jobId?.title}</div>
                  <div className="text-sm text-gray-600">{item.jobId?.company}</div>
                  <div className="text-sm text-gray-600">{item.jobId?.location}</div>
                </div>
                <button
                  onClick={() => {
                    const jobIdToRemove = item.jobId?._id || item.jobId || item.jobId?.id;
                    if (jobIdToRemove) handleRemove(jobIdToRemove);
                  }}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-600 text-center py-6">No saved jobs.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedJobs;
