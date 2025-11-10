import React, { useEffect, useState } from "react";

const SavedJobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("savedJobsList") || "[]");
      setJobs(Array.isArray(list) ? list : []);
    } catch {
      setJobs([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Saved Jobs</h1>
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-gray-50">
              <div className="text-lg font-semibold text-gray-900">{job.title}</div>
              <div className="text-sm text-gray-600">{job.company}</div>
              <div className="text-sm text-gray-600">{job.location}</div>
            </div>
          ))}
          {jobs.length === 0 && <div className="text-gray-600">No saved jobs.</div>}
        </div>
      </div>
    </div>
  );
};

export default SavedJobs;



