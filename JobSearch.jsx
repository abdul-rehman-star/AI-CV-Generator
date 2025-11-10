import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaMapMarkerAlt, FaBuilding, FaDollarSign, FaCodeBranch, FaCheckCircle, FaHeart, FaRegHeart, FaClock, FaFilter, FaTimes, FaSort } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import JobDetails from "./JobDetails";

// Jobs will be loaded from backend /api/jobs

const JobSearch = () => {
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [sortBy, setSortBy] = useState("newest");
  const [appliedFilters, setAppliedFilters] = useState([]);
  // Sidebar filter state
  const [skillQuery, setSkillQuery] = useState("");
  const [salaryRange, setSalaryRange] = useState("All Ranges");
  const [selectedJobTypes, setSelectedJobTypes] = useState(new Set());
  const [locationQuery, setLocationQuery] = useState("");
  
  // Job Details Modal State
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);

  // Application form state
  const [applyForm, setApplyForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    resumeUrl: "", // kept for backward compatibility, not shown in UI
    coverLetter: "",
  });
  const [applyError, setApplyError] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [resumeDataUrl, setResumeDataUrl] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    // Add toast as hidden first for enter transition
    setToasts((t) => [...t, { id, message, type, visible: false }]);
    // Trigger visibility on next tick for smooth transition
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, visible: true } : x)));
    }, 10);
    // Auto-remove after a short delay
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2500);
  };

  // Per-user applied/tested tracking
  const userKey = (() => {
    const id = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const email = localStorage.getItem("userEmail") || localStorage.getItem("user") || sessionStorage.getItem("userEmail");
    return (id || email || "anon").toString();
  })();
  const appliedKey = `appliedJobsByUser:${userKey}`;
  const testedKey = `testedJobsByUser:${userKey}`;
  const [appliedJobsSet, setAppliedJobsSet] = useState(new Set());
  const [testedJobsSet, setTestedJobsSet] = useState(new Set());

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem(appliedKey) || "[]");
      const t = JSON.parse(localStorage.getItem(testedKey) || "[]");
      setAppliedJobsSet(new Set(a));
      setTestedJobsSet(new Set(t));
    } catch {
      setAppliedJobsSet(new Set());
      setTestedJobsSet(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey, testedKey]);

  // Test-related state
  const [testByJob, setTestByJob] = useState({}); // jobId -> { available: bool }
  const [testData, setTestData] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState("");
  const [testAnswers, setTestAnswers] = useState({}); // { qIndex1Based: optionIndex }
  const [testStartAt, setTestStartAt] = useState(null);

  const navigate = useNavigate();

  const userProfile = (() => {
    try {
      return JSON.parse(localStorage.getItem("userProfile")) || null;
    } catch {
      return null;
    }
  })();

  // Utility functions
  const formatSalary = (salary) => {
    if (!salary) return "Salary not specified";
    const numSalary = parseInt(salary.replace(/[^0-9]/g, ''));
    if (numSalary >= 1000000) {
      return `$${(numSalary / 1000000).toFixed(1)}M`;
    } else if (numSalary >= 1000) {
      return `$${(numSalary / 1000).toFixed(0)}K`;
    }
    return `$${numSalary.toLocaleString()}`;
  };

  const getTimeAgo = (date) => {
    if (!date) return "Recently posted";
    const now = new Date();
    const posted = new Date(date);
    const diffTime = Math.abs(now - posted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return "Recently posted";
  };

  // Helper is used in filtering before sorting section; keep as function declaration to allow hoisting
  function parseSalaryNumber(salary) {
    if (!salary) return 0;
    try {
      const num = parseInt(String(salary).replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 0 : num;
    } catch {
      return 0;
    }
  }

  const toggleSaveJob = (job) => {
    const jobId = job._id || job.id;
    const newSavedJobs = new Set(savedJobs);
    
    if (savedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
    } else {
      newSavedJobs.add(jobId);
      saveJob(job);
    }
    setSavedJobs(newSavedJobs);
  };

  const clearFilters = () => {
    setAppliedFilters([]);
    setSearch("");
    setSkillQuery("");
    setSalaryRange("All Ranges");
    setSelectedJobTypes(new Set());
    setLocationQuery("");
  };

  const incrementCounter = (key) => {
    try {
      const current = parseInt(localStorage.getItem(key) || "0", 10) || 0;
      localStorage.setItem(key, String(current + 1));
      // Fire a storage event for same-tab listeners
      window.dispatchEvent(new StorageEvent("storage", { key, newValue: String(current + 1) }));
    } catch { /* no-op */ }
  };

  const handleApply = (job) => {
    // Step 1: open application form modal first
    const jobId = job._id || job.id;
    if (appliedJobsSet.has(jobId)) {
      showToast("You already applied", "warn");
      return;
    }
    setSelectedJob(job);
    setTestData(null);
    setTestError("");
    setApplyError("");
    setApplySubmitting(false);
    setApplySuccess(false);
    setApplyForm({
      fullName: localStorage.getItem("userName") || localStorage.getItem("user_name") || "",
      email: localStorage.getItem("userEmail") || localStorage.getItem("user") || "",
      phone: "",
      resumeUrl: "",
      coverLetter: "",
    });
    setResumeDataUrl("");
    setResumeFileName("");
    setShowModal(true);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setApplyError("");
    setApplySubmitting(true);

    // Minimal validation
    if (!applyForm.fullName || !applyForm.email) {
      setApplyError("Name and Email are required");
      setApplySubmitting(false);
      return;
    }

    try {
      // Persist application to backend
      const payload = {
        jobId: selectedJob._id || selectedJob.id,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        applicantId: localStorage.getItem("userId") || sessionStorage.getItem("userId") || null,
        applicantEmail: applyForm.email,
        applicantName: applyForm.fullName,
        phone: applyForm.phone,
        // send uploaded resume as data URL string in existing field
        resumeUrl: resumeDataUrl || "",
        coverLetter: applyForm.coverLetter,
      };
      await axios.post("/api/applications", payload);
      incrementCounter("applicationsCount");
      setApplySuccess(true);
      // Mark job as applied locally
      const jobId = selectedJob._id || selectedJob.id;
      const nextApplied = new Set(appliedJobsSet);
      nextApplied.add(jobId);
      setAppliedJobsSet(nextApplied);
      try { localStorage.setItem(appliedKey, JSON.stringify(Array.from(nextApplied))); } catch {}

      // Step 2: after application, check if a test exists and open test if available
      setTestLoading(true);
      try {
        const jobId2 = selectedJob._id || selectedJob.id;
        // If already took test for this job, skip opening and notify
        if (testedJobsSet.has(jobId2)) {
          setTestData(null);
          setShowModal(false);
          setApplySuccess(false);
          showToast("You already attempted the test", "warn");
          return;
        }
        const { data } = await axios.get(`/api/tests/by-job/${jobId2}`);
        // Test exists → open test modal within same dialog
        setTestData(data);
        setTestAnswers({});
        setTestStartAt(Date.now());
        setTestByJob((prev) => ({ ...prev, [jobId2]: { available: true } }));
        // keep modal open to show the test
      } catch {
        // No test available → close modal
        setTestData(null);
        setTestByJob((prev) => ({ ...prev, [selectedJob._id || selectedJob.id]: { available: false } }));
        setShowModal(false);
        setApplySuccess(false);
      } finally {
        setTestLoading(false);
      }
    } catch (err) {
      setApplyError(err?.response?.data?.error || err?.message || "Failed to submit application");
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleResumeFile = (file) => {
    if (!file) return;
    setResumeFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = String(reader.result || "");
        setResumeDataUrl(result);
      } catch { /* no-op */ }
    };
    reader.readAsDataURL(file);
  };

  const chooseAnswer = (qIndex, optionIndex) => {
    // qIndex is 0-based; store 1-based as backend expects
    setTestAnswers((prev) => ({ ...prev, [qIndex + 1]: optionIndex }));
  };

  const submitTest = async () => {
    if (!testData || !selectedJob) return;
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId") || localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "anonymous";
    const userEmail = localStorage.getItem("userEmail") || localStorage.getItem("user") || undefined;
    const timeTaken = testStartAt ? Math.floor((Date.now() - testStartAt) / 1000) : 0;
    try {
      const { data } = await axios.post("/api/tests/submit", {
        testId: testData._id,
        jobId: selectedJob._id || selectedJob.id,
        userId,
        answers: testAnswers,
        timeTaken,
      });
      const percent = data.total > 0 ? (data.score / data.total) * 100 : 0;
      showToast(`You scored ${data.score}/${data.total} (${Math.round(percent)}%)`, "success");
      // Mark as tested once
      const jobId = selectedJob._id || selectedJob.id;
      const nextTested = new Set(testedJobsSet);
      nextTested.add(jobId);
      setTestedJobsSet(nextTested);
      try { localStorage.setItem(testedKey, JSON.stringify(Array.from(nextTested))); } catch {}
      setShowModal(false);
      setTestData(null);
      setTestAnswers({});
      if (percent >= 80) {
        incrementCounter("interviewsCount");
        // Try to fetch interview schedule and accept it automatically
        try {
          await axios.get(`/api/interviews/by-job/${selectedJob._id || selectedJob.id}`);
          await axios.post(`/api/interviews/accept`, {
            jobId: selectedJob._id || selectedJob.id,
            userId,
            email: userEmail,
          });
        } catch { /* no-op */ }
        const proceed = window.confirm("Great job! You qualified for an interview. Proceed to schedule?");
        if (proceed) navigate("/interviews");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed to submit test";
      setTestError(msg);
    }
  };

  // Save job handler
  const saveJob = (job) => {
    try {
      const list = JSON.parse(localStorage.getItem("savedJobsList") || "[]");
      const id = job._id || job.id;
      if (!list.find((j) => (j._id || j.id) === id)) {
        list.push(job);
        localStorage.setItem("savedJobsList", JSON.stringify(list));
        incrementCounter("savedJobsCount");
        showToast("JOB SAVED SUCCESSFULLY", "success");
      } else {
        showToast("JOB ALREADY SAVED", "warn");
      }
    } catch {
      incrementCounter("savedJobsCount");
    }
  };

  // Handle view details button click
  const handleViewDetails = (job) => {
    setSelectedJobForDetails(job);
    setShowJobDetails(true);
  };

  // Close job details modal
  const closeJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJobForDetails(null);
  };

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
    const matchesSearch =
      (job.title || "").toLowerCase().includes(searchTerm) ||
      (job.company || "").toLowerCase().includes(searchTerm) ||
      (job.description || "").toLowerCase().includes(searchTerm);

    // Explicit sidebar filters
    // Skills filter (comma-separated tokens)
    const skillTokens = skillQuery
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const skillsArray = Array.isArray(job.skills) ? job.skills.map((s)=>String(s).toLowerCase()) : [];
    const skillsFilterOk =
      skillTokens.length === 0 || skillTokens.some((tok) => skillsArray.includes(tok));

    // Salary filter buckets
    const sal = parseSalaryNumber(job.salary);
    const salaryOk = (() => {
      switch (salaryRange) {
        case "$30K - $50K":
          return sal >= 30000 && sal <= 50000;
        case "$50K - $80K":
          return sal >= 50000 && sal <= 80000;
        case "$80K - $120K":
          return sal >= 80000 && sal <= 120000;
        case "$120K+":
          return sal >= 120000;
        case "All Ranges":
        default:
          return true;
      }
    })();

    // Job type filter
    const jobTypeSel = Array.from(selectedJobTypes);
    const typeStr = String(job.type || '').toLowerCase();
    const typeOk =
      jobTypeSel.length === 0 ||
      jobTypeSel.some((t) => typeStr.includes(String(t).toLowerCase()));

    // Location filter (substring, case-insensitive)
    const locTok = locationQuery.trim().toLowerCase();
    const locationOk = !locTok || String(job.location || '').toLowerCase().includes(locTok);

    // If no profile, only apply search filter
    const sidebarOk = matchesSearch && skillsFilterOk && salaryOk && typeOk && locationOk;
    if (!userProfile) return sidebarOk;

    const profileSkills = (userProfile?.skills?.skillset || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const profileLocation = (
      userProfile?.personalInfo?.location ||
      userProfile?.personalInfo?.city ||
      ""
    ).toLowerCase();

    const skillsArrayProfile = Array.isArray(job.skills) ? job.skills : [];
    const skillsMatch =
      profileSkills.length === 0 ||
      skillsArrayProfile.some((s) => profileSkills.includes(String(s).toLowerCase()));

    // Make location non-restrictive unless it clearly matches
    const locationMatch =
      !profileLocation || (job.location || "").toLowerCase().includes(profileLocation);

    // Keep results if search matches and at least one personalization matches
    return sidebarOk && (skillsMatch || locationMatch);
  });

  console.log('JobSearch rendering...', { loading, error, jobs: jobs.length, filteredJobs: filteredJobs.length });

  // Helpers for sorting

  const isRemoteJob = (job) => {
    const type = String(job?.type || '').toLowerCase();
    const loc = String(job?.location || '').toLowerCase();
    return type.includes('remote') || loc.includes('remote');
  };

  // Apply sorting based on sortBy selection
  const sortedJobs = React.useMemo(() => {
    const arr = [...filteredJobs];
    switch (sortBy) {
      case 'salary': {
        // Highest salary first
        arr.sort((a, b) => parseSalaryNumber(b.salary) - parseSalaryNumber(a.salary));
        break;
      }
      case 'company': {
        // Company A-Z
        arr.sort((a, b) => String(a.company || '').localeCompare(String(b.company || '')));
        break;
      }
      case 'remote': {
        // Remote first; keep relative order for same group by date desc
        arr.sort((a, b) => {
          const ra = isRemoteJob(a) ? 0 : 1;
          const rb = isRemoteJob(b) ? 0 : 1;
          if (ra !== rb) return ra - rb;
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta; // newer first within group
        });
        break;
      }
      case 'newest':
      default: {
        // Newest first by createdAt
        arr.sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });
        break;
      }
    }
    return arr;
  }, [filteredJobs, sortBy]);

  // Simple fallback for debugging
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-black text-lg">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toasts (centered with smooth enter) */}
      <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
        <div className="space-y-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-10 py-6 rounded-xl shadow-2xl text-black text-lg font-bold sm:text-base pointer-events-auto transform transition-all duration-700 ease-out ${
                t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-95'
              } ${t.type === 'success' ? 'bg-white' : t.type === 'warn' ? 'bg-white' : 'bg-gray-900'}`}
            >
              {t.message}
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-1/3 lg:w-1/4 bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-gray-100 md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <FaFilter className="text-black" />
              Filters
            </h2>
            {appliedFilters.length > 0 && (
              <button 
                onClick={clearFilters}
                className="text-sm text-black hover:text-indigo-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Applied Filters */}
          {appliedFilters.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {appliedFilters.map((filter, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {filter}
                    <FaTimes className="cursor-pointer hover:text-indigo-900" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {userProfile && (
            <div className="mb-6 text-xs text-white bg-[#3e3f4a] border-indigo-200 rounded-lg p-3">
              <FaCheckCircle className="inline mr-2" />
              Using your profile to personalize jobs
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Skills</label>
              <input 
                type="text" 
                placeholder="e.g. React, Node.js, Python" 
                value={skillQuery}
                onChange={(e)=>setSkillQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" 
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Salary Range</label>
              <select value={salaryRange} onChange={(e)=>setSalaryRange(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200">
                <option>All Ranges</option>
                <option>$30K - $50K</option>
                <option>$50K - $80K</option>
                <option>$80K - $120K</option>
                <option>$120K+</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Job Type</label>
              <div className="space-y-2">
                {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedJobTypes.has(type)}
                      onChange={(e)=>{
                        setSelectedJobTypes((prev)=>{
                          const next = new Set(prev);
                          if (e.target.checked) next.add(type); else next.delete(type);
                          return next;
                        });
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Location</label>
              <input 
                type="text" 
                placeholder="e.g. Lahore, Karachi, Remote" 
                value={locationQuery}
                onChange={(e)=>setLocationQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" 
              />
            </div>

            <button
              onClick={()=>{
                const chips = [];
                if (skillQuery.trim()) chips.push(`Skills: ${skillQuery.trim()}`);
                if (salaryRange !== 'All Ranges') chips.push(`Salary: ${salaryRange}`);
                if (selectedJobTypes.size) chips.push(`Type: ${Array.from(selectedJobTypes).join(', ')}`);
                if (locationQuery.trim()) chips.push(`Location: ${locationQuery.trim()}`);
                setAppliedFilters(chips);
              }}
              className="w-full bg-[#3e3f4a] text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Job Listings */}
        <main className="flex-1">
          {/* Search Bar and Sort */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title, company, or skills..."
                className="w-full p-4 pl-12 pr-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-gray-700"
              />
            </div>
            
            {/* Sort and Results Count */}
            <div className="flex justify-between items-center">
              <div className="text-gray-600">
                <span className="font-medium">{filteredJobs.length}</span> jobs found
              </div>
              <div className="flex items-center gap-2">
                <FaSort className="text-gray-400" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="salary">Highest Salary</option>
                  <option value="company">Company A-Z</option>
                  <option value="remote">Remote First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 text-lg py-10">Loading jobs...</p>
            ) : error ? (
              <p className="text-center text-red-500 text-lg py-10">{error}</p>
            ) : sortedJobs.length > 0 ? (
              sortedJobs.map((job) => (
                <div 
                  key={job._id || job.id} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                >
                  {/* Header with Company Logo and Job Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {/* Company Logo Placeholder */}
                      <div className="w-12 h-12 bg-[black] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {job.company?.charAt(0) || 'C'}
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-900  ">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mt-1">
                          <FaBuilding className="text-sm" />
                          <span className="font-medium">{job.company}</span>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1">
                            <FaClock className="text-sm" />
                            <span className="text-sm">{getTimeAgo(job.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Job Type Badge and Save Button */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveJob(job);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      >
                        {savedJobs.has(job._id || job.id) ? 
                          <FaHeart className="text-red-500" /> : 
                          <FaRegHeart />
                        }
                      </button>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.type === 'Remote' ? 'bg-green-100 text-green-700' :
                        job.type === 'Full-time' ? 'bg-blue-100 text-blue-700' :
                        job.type === 'Part-time' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {job.type || 'Full-time'}
                      </span>
                      
                      {testByJob[job._id || job.id]?.available && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">
                          ✓ Test Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaDollarSign className="text-xl" />
                      <span className="font-medium">{formatSalary(job.salary)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaMapMarkerAlt className="text-black text-xl" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaBuilding className="text-[#3e3f4a] text-xl" />
                      <span>Company Size: 50-200</span>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  {Array.isArray(job.skills) && job.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 4).map((skill, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 4 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                            +{job.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(job);
                      }}
                      className="flex-1 bg-[#3e3f4a] text-white font-semibold px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-sm"
                    >
                      Apply Now
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveJob(job);
                      }}
                      className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                        savedJobs.has(job._id || job.id)
                          ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                          : 'bg-black text-[#ffff] border-blue-300 hover:bg-blue-200'
                      }`}
                    >
                      {savedJobs.has(job._id || job.id) ? 'Saved ✓' : 'Save Job'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(job);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 text-lg py-10">No jobs found matching your search criteria.</p>
            )}
          </div>
        </main>
      </div>

      {/* Modal: Application Form or Test */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 bg-black/0 backdrop-blur-[2px] flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
            {!testData ? (
              // Application Form
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-800">Apply for {selectedJob.title}</h2>
                  <p className="text-gray-600 mt-1">Please fill in your details</p>
                </div>
                {applyError && <div className="mb-4 text-sm text-red-700 bg-red-100 p-2 rounded">{applyError}</div>}
                <form className="space-y-4" onSubmit={submitApplication}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        value={applyForm.fullName}
                        onChange={(e) => setApplyForm((f) => ({ ...f, fullName: e.target.value }))}
                        className="w-full p-3 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={applyForm.email}
                        onChange={(e) => setApplyForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full p-3 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="text"
                        value={applyForm.phone}
                        onChange={(e) => setApplyForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full p-3 border rounded-lg"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Resume</label>
                      <div
                        onDragOver={(e)=>{e.preventDefault(); e.stopPropagation();}}
                        onDrop={(e)=>{
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleResumeFile(file);
                        }}
                        className="w-full p-3 border rounded-lg text-gray-600 bg-gray-50"
                      >
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e)=>{ const f = e.target.files?.[0]; if (f) handleResumeFile(f); }}
                        />
                        {resumeFileName && (
                          <div className="text-sm mt-2">Selected: {resumeFileName}</div>
                        )}
                        {!resumeFileName && (
                          <div className="text-sm">Drag & drop your resume here or click to select</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cover Letter</label>
                    <textarea
                      rows={4}
                      value={applyForm.coverLetter}
                      onChange={(e) => setApplyForm((f) => ({ ...f, coverLetter: e.target.value }))}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Optional message for the employer"
                    />
                  </div>
                  <div className="flex justify-end space-x-4 mt-2">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setApplySuccess(false); }}
                      className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2 rounded-lg font-semibold disabled:opacity-60 flex items-center gap-2 ${applySuccess ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      disabled={applySubmitting || applySuccess}
                    >
                      {applySubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Submitting...
                        </>
                      ) : applySuccess ? (
                        <>
                          <FaCheckCircle /> Submitted
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // Test Modal
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{testData.title}</h2>
                  <p className="text-sm text-gray-600">Duration: {(testData.durationSec || 0) / 60} minutes</p>
                  {testError && <div className="text-red-600 text-sm mt-2">{testError}</div>}
                </div>

                <div className="max-h-[60vh] overflow-auto pr-2 space-y-4">
                  {testData.questions.map((q, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="font-medium text-gray-900 mb-2">Q{idx + 1}. {q.text}</div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-center space-x-2 text-gray-700">
                            <input
                              type="radio"
                              name={`q_${idx}`}
                              checked={testAnswers[idx + 1] === optIdx}
                              onChange={() => chooseAnswer(idx, optIdx)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTest}
                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                    disabled={testLoading}
                  >
                    Submit Test
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJobForDetails && (
        <JobDetails 
          job={selectedJobForDetails}
          onClose={closeJobDetails}
        />
      )}
    </div>
  );
};

export default JobSearch;