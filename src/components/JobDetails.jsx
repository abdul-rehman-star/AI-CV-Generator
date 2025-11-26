import React, { useEffect, useState } from "react";
import { FaTimes } from 'react-icons/fa';

// Right-side drawer that can fetch full job details by id
const JobDetails = ({ job, jobId, onClose }) => {
  
  const [fullJob, setFullJob] = useState(job || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    // If we only have id, fetch details
    if (jobId && (!job || !job.description || !job.requirements)) {
      setLoading(true);
      setError("");
      fetch(`/api/jobs/${jobId}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data?.error || "Failed to load job");
          return data;
        })
        .then((data) => {
          if (!ignore) setFullJob(data);
        })
        .catch((e) => {
          if (!ignore) setError(e?.message || "Failed to load job");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      setFullJob(job || null);
    }
    return () => {
      ignore = true;
    };
  }, [jobId, job]);

  if (!job && !jobId) return null;
  const shown = fullJob || job || {};

  

  // const matchingPercentage = 75; // removed along with match UI

  return (
    <div className="fixed inset-0 bg-black/0 backdrop-blur-[3px] flex justify-end items-stretch z-50">
      {/* Drawer Panel */}
      <div className="bg-white w-full sm:w-[520px] max-w-[620px] h-full relative shadow-2xl overflow-y-auto">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-colors">
          <FaTimes size={24} />
        </button>

        {/* Header Section */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-extrabold text-gray-800">{shown.title || 'Job'}</h2>
          <p className="text-gray-600">{shown.company} • {shown.location}</p>
          {loading && <div className="text-sm text-gray-500 mt-1">Loading details...</div>}
          {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 p-6">
          <div className="col-span-2">
            {/* Job Description */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Job Description</h3>
              <p className="text-gray-700 leading-relaxed">{shown.description || 'No description available.'}</p>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Requirements</h3>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                {Array.isArray(shown.requirements) && shown.requirements.length > 0 ? (
                  shown.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))
                ) : (
                  <li>No specific requirements listed</li>
                )}
              </ul>
            </div>

            {/* Skills */}
            {Array.isArray(shown.skills) && shown.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {shown.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Details Grid */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Job Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Salary</h4>
                  <p className="text-gray-600">{shown.salary || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Job Type</h4>
                  <p className="text-gray-600">{shown.type || 'Full-time'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Location</h4>
                  <p className="text-gray-600">{shown.location || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Experience</h4>
                  <p className="text-gray-600">{shown.experience || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          
        </div>

        
      </div>
    </div>
  );
};

export default JobDetails;



