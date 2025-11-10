import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaMapMarkerAlt, FaBuilding, FaDollarSign } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

const JobSearchSimple = () => {
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Fetch jobs from backend once on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    axios
      .get('/api/jobs')
      .then(({ data }) => {
        if (!isMounted) return;
        const jobsArray = Array.isArray(data) ? data : [];
        console.log('jobs fetched:', jobsArray.length, jobsArray[0]);
        setJobs(jobsArray);
        setError("");
      })
      .catch((e) => {
        if (!isMounted) return;
        const message = e?.response?.data?.error || e?.message || 'Failed to load jobs';
        setError(message);
        setJobs([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const searchTerm = search.toLowerCase();
    return (
      (job.title || "").toLowerCase().includes(searchTerm) ||
      (job.company || "").toLowerCase().includes(searchTerm) ||
      (job.description || "").toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Search - Simple Version</h1>
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for jobs..."
            className="w-full p-4 pl-12 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading jobs...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-10">{error}</p>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job._id || job.id} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-4 text-gray-600 mt-2">
                      <div className="flex items-center gap-1">
                        <FaBuilding className="text-sm" />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-sm" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaDollarSign className="text-sm" />
                        <span>{job.salary || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {job.type || 'Full-time'}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{job.description}</p>
                
                <div className="flex gap-3">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Apply Now
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Save Job
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">No jobs found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSearchSimple;

