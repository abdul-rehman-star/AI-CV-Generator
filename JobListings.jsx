import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaBuilding } from "react-icons/fa";
import JobDetails from "./JobDetails";

const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobPrefill, setSelectedJobPrefill] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchJobs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load jobs");
        if (!ignore) setJobs(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load jobs");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchJobs();
    return () => {
      ignore = true;
    };
  }, []);

  const openJob = (job) => {
    setSelectedJobId(job?._id || job?.id);
    // Pass what we already have, full details will be fetched by JobDetails
    setSelectedJobPrefill(job);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">Available Jobs</h2>

        {loading && <div className="text-center text-gray-600">Loading jobs...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}

        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job._id || job.id}
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
              onClick={() => openJob(job)}
            >
              <h3 className="text-2xl font-bold text-black mb-2">{job.title}</h3>
              <div className="flex items-center text-gray-600 text-sm space-x-4 mb-3">
                <p className="flex items-center">
                  <FaBuilding className="mr-1 text-gray-400" /> {job.company}
                </p>
                <p className="flex items-center">
                  <FaMapMarkerAlt className="mr-1 text-gray-400" /> {job.location}
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">{job.description}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openJob(job);
                }}
                className="w-full px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedJobId && (
        <JobDetails
          job={selectedJobPrefill}
          jobId={selectedJobId}
          onClose={() => {
            setSelectedJobId(null);
            setSelectedJobPrefill(null);
          }}
        />
      )}
    </div>
  );
};

export default JobListings;