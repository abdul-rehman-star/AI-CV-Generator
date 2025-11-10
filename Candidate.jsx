import React from "react";
import { Link, useLocation } from "react-router-dom";
import AppliedPersons from "./AppliedPersons";
import PassedCandidates from "./PassedCandidates";
import Notifications from "./Notifications";
import SavedJobs from "./SavedJobs";
import { FaUser, FaBriefcase, FaChartLine, FaBell, FaHome, FaSave } from "react-icons/fa";

const SidebarLink = ({ to, icon: Icon, label, onClick }) => (
  onClick ? (
    <button onClick={onClick} className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-white/10 hover:text-white transition text-left">
      {React.createElement(Icon, { className: "text-white/90" })}
      <span className="text-white font-medium">{label}</span>
    </button>
  ) : (
    <Link to={to} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-white/10 hover:text-white transition">
      {React.createElement(Icon, { className: "text-white/90" })}
      <span className="text-white font-medium">{label}</span>
    </Link>
  )
);

const KPI = ({ title, value, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white/90 backdrop-blur p-5 rounded-2xl shadow border border-white/40 ${onClick ? "cursor-pointer hover:shadow-md transition" : ""}`}
  >
    <h4 className="font-semibold text-gray-600">{title}</h4>
    <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
  </div>
);

const Candidate = () => {
  const location = useLocation();
  const name = (typeof window !== 'undefined' && (
    localStorage.getItem("userName") ||
    localStorage.getItem("user_name") ||
    sessionStorage.getItem("userName") ||
    sessionStorage.getItem("user_name") ||
    ""
  )) || "";
  const email = (typeof window !== 'undefined' && (
    localStorage.getItem("userEmail") ||
    sessionStorage.getItem("userEmail") ||
    localStorage.getItem("user") ||
    sessionStorage.getItem("user") ||
    ""
  )) || "";
  const userRole = (typeof window !== 'undefined' && localStorage.getItem("userRole")) || "seeker"; // 'seeker' | 'poster'
  const displayName = name || (email ? email.split("@")[0] : "");
  const initials = (displayName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

  // Dynamic labels based on selected role
  const labelApplications = userRole === "poster" ? "Post jobs" : "Applications";
  const labelInterviews = userRole === "poster" ? "Schedule interviews" : "Interviews";
  const labelOffers = userRole === "poster" ? "Test results" : "Offers";
  const labelSaved = userRole === "poster" ? "Applied persons" : "Saved Jobs";

  // Sidebar routes depend on role
  const linkApplications = userRole === "poster" ? "/post-job" : "/applications";
  // Notifications opened inline for both roles

  // Dynamic KPI values
  const [kpi1, setKpi1] = React.useState(0);
  const [kpi2, setKpi2] = React.useState(0);
  const [kpi3, setKpi3] = React.useState(0);
  const [kpi4, setKpi4] = React.useState(0);
  const [upcoming, setUpcoming] = React.useState([]);
  const [appliedJobs, setAppliedJobs] = React.useState([]);
  const [postedJobs, setPostedJobs] = React.useState([]);

  React.useEffect(() => {
    let ignore = false;

    const loadForPoster = async () => {
      try {
        const companyId = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || localStorage.getItem("user") || email;
        const jobsRes = await fetch(`http://localhost:5000/api/jobs`);
        const jobsAll = await jobsRes.json().catch(() => []);
        const myJobs = Array.isArray(jobsAll) ? jobsAll.filter(j => {
          const jobEmail = (j.postedByEmail || "").toLowerCase();
          const userEmail = (companyId || "").toLowerCase();
          return jobEmail === userEmail;
        }) : [];
        if (!ignore) {
          setKpi1(myJobs.length);
          setPostedJobs(myJobs); // Store posted jobs for display
          console.log('Posted jobs for company:', companyId, myJobs);
        }

        const ivRes = await fetch(`http://localhost:5000/api/interviews/by-company/${encodeURIComponent(companyId)}`);
        const interviews = await ivRes.json().catch(() => []);
        if (!ignore) setKpi2(Array.isArray(interviews) ? interviews.length : 0);

        const testsRes = await fetch(`http://localhost:5000/api/tests/by-company/${encodeURIComponent(companyId)}`);
        const tests = await testsRes.json().catch(() => []);
        if (!ignore) setKpi3(Array.isArray(tests) ? tests.length : 0);

        const jobIds = myJobs.map(j => j._id || j.id).filter(Boolean);
        if (jobIds.length) {
          const appsRes = await fetch(`http://localhost:5000/api/applications/by-jobs?jobIds=${encodeURIComponent(jobIds.join(","))}`);
          const apps = await appsRes.json().catch(() => ({ total: 0 }));
          if (!ignore) setKpi4(Number(apps?.total || 0));
        } else if (!ignore) {
          setKpi4(0);
        }
      } catch (error) {
        console.error('Error loading poster data:', error);
        if (!ignore) {
          setKpi1(0); setKpi2(0); setKpi3(0); setKpi4(0);
        }
      }
    };

    const loadForSeeker = async () => {
      try {
        setKpi1(parseInt(localStorage.getItem("applicationsCount") || "0", 10) || 0);
        setKpi2(parseInt(localStorage.getItem("interviewsCount") || "0", 10) || 0);
        setKpi3(42);
        setKpi4(parseInt(localStorage.getItem("savedJobsCount") || "0", 10) || 0);
        const emailSeeker = localStorage.getItem("userEmail") || localStorage.getItem("user") || "";
        if (emailSeeker) {
          const res = await fetch(`/api/interviews/by-candidate/${encodeURIComponent(emailSeeker)}`);
          const list = await res.json().catch(() => []);
          if (!ignore) setUpcoming(Array.isArray(list) ? list : []);
          
          // Fetch applied jobs
          try {
            console.log('Fetching applied jobs for email:', emailSeeker);
            const appsRes = await fetch(`/api/applications/by-user?email=${encodeURIComponent(emailSeeker)}`);
            const apps = await appsRes.json();
            console.log('Applied jobs response:', apps);
            if (!ignore) setAppliedJobs(Array.isArray(apps) ? apps : []);
          } catch (appsError) {
            console.error('Error fetching applied jobs:', appsError);
            if (!ignore) setAppliedJobs([]);
          }
        }
      } catch {
        if (!ignore) {
          setKpi1(0); setKpi2(0); setKpi3(0); setKpi4(0);
        }
      }
    };

    if (userRole === 'poster') loadForPoster(); else loadForSeeker();
    return () => { ignore = true; };
  }, [userRole, email, location.pathname]); // Add location.pathname to refresh when navigating back

  const [showApplied, setShowApplied] = React.useState(false); // for posters (Applied persons)
  const [selectedJobForApplied, setSelectedJobForApplied] = React.useState(null);
  const [showApplications, setShowApplications] = React.useState(false); // for seekers
  const [showPassed, setShowPassed] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSaved, setShowSaved] = React.useState(false);
  return (
    <div className="min-h-screen bg-gray">
      <div>
        {/* Sidebar */}
        <aside className="hidden md:flex md:fixed md:left-0 md:top-20 md:w-64 h-[calc(100vh-5rem)] overflow-auto flex-col bg-[black] space-y-6 rounded-br-3xl z-40">
          <div className="flex items-center gap-2 text-white text-xl font-bold mt-4">
            <FaHome /> Dashboard
          </div>
          <nav className="space-y-1">
            <SidebarLink to="/profile" icon={FaUser} label="Profile" />
            {userRole === 'poster' ? (
              <SidebarLink to={linkApplications} icon={FaBriefcase} label={labelApplications} />
            ) : (
              <SidebarLink icon={FaBriefcase} label={labelApplications} onClick={()=> setShowApplications(true)} />
            )}
            <SidebarLink to="/stats" icon={FaChartLine} label="Statistics" />
            <SidebarLink icon={FaBell} label="Notifications" onClick={()=> setShowNotifications(true)} />
            {userRole === 'poster' ? (
              <SidebarLink icon={FaSave} label={labelSaved} onClick={()=> setShowApplied(true)} />
            ) : (
              <SidebarLink icon={FaSave} label={labelSaved} onClick={()=> setShowSaved(true)} />
            )}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 md:ml-64">
          {/* Hero */}
          <div className="relative overflow-hidden ">
            <div className="h-52 md:h-60 bg-[#475061]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-2">
              <h1 className="text-center text-white font-extrabold text-2xl md:text-4xl max-w-3xl ">
                {userRole === 'poster' ? 'Company Dashboard' : 'Candidate Dashboard'}
              </h1>
              {/* User badge */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 flex items-center gap-4 px-5 py-3">
                <div className="w-12 h-14  rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">
                  {initials}
                </div>
                <div>
                  <div className="text-gray-900 font-semibold leading-tight">{displayName || 'User'}</div>
                  {email && <div className="text-xs text-gray-600">{email}</div>}
                </div>
              </div>
            </div>
            <svg className="absolute right-[-40px] top-[-30px] opacity-20" width="220" height="220">
              <circle cx="110" cy="110" r="110" fill="white" />
            </svg>
          </div>

          <div className="-mt-10 md:-mt-12 px-4 md:px-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 mt-4 md:grid-cols-4 gap-5 md:gap-7">
              <KPI title={labelApplications} value={kpi1} onClick={() => userRole === 'poster' ? null : setShowApplications(true)} />
              <KPI title={labelInterviews} value={kpi2} />
              <KPI title={labelOffers} value={kpi3} />
              <KPI title={labelSaved} value={kpi4} onClick={() => userRole === 'poster' ? setShowApplied(true) : setShowSaved(true)} />
            </div>

            {/* Profile completion */}
            <div className="bg-white rounded-2xl shadow p-6 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Profile Completion</h3>
                <span className="text-sm text-gray-500">70%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-indigo-600 h-3 rounded-full" style={{ width: "70%" }} />
              </div>
            </div>

            {/* Jobs Section - Applied Jobs for Seekers, Posted Jobs for Posters */}
            <div className="mt-6 pb-10">
              <section className="bg-white rounded-2xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {userRole === 'poster' ? 'Posted Jobs' : 'Applied Jobs'}
                </h3>
                <div className="space-y-3">
                  {userRole === 'poster' ? (
                    // Posted Jobs for Company/Poster
                    postedJobs.length > 0 ? (
                      postedJobs.map((job, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-l-4 border-green-500">
                          <div>
                            <div className="font-semibold text-gray-900">{job.title || 'Job Title'}</div>
                            <div className="text-sm text-gray-600">{job.company || 'Company'}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full text-xs">
                              Active
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {job.location || 'Location not specified'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {job.salary || 'Salary not specified'}
                            </div>
                            <button
                              onClick={() => { setSelectedJobForApplied(job._id || job.id); setShowApplied(true); }}
                              className="mt-2 px-3 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                            >
                              View Applicants
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">💼</div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No Jobs Posted Yet</h4>
                        <p className="text-sm">Start posting jobs to manage them here!</p>
                        <div className="mt-4">
                          <button 
                            onClick={() => window.location.href = '/post-job'} 
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            Post a Job
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    // Applied Jobs for Job Seekers
                    appliedJobs.length > 0 ? (
                      appliedJobs.map((app, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-l-4 border-indigo-500">
                          <div>
                            <div className="font-semibold text-gray-900">{app.jobTitle || 'Job Title'}</div>
                            <div className="text-sm text-gray-600">{app.company || 'Company'}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className={`text-sm font-bold px-3 py-1 rounded-full text-xs ${
                              app.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                              app.status === 'Interview' ? 'bg-green-100 text-green-700' :
                              app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {app.status || 'Applied'}
                            </div>
                            {app.applicantEmail && (
                              <div className="text-xs text-gray-500 mt-1">
                                {app.applicantEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📄</div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No Applications Yet</h4>
                        <p className="text-sm">Start applying to jobs to track your applications here!</p>
                        <div className="mt-4">
                          <button 
                            onClick={() => window.location.href = '/jobs'} 
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                          >
                            Browse Jobs
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
              
              {userRole === 'seeker' && (
                <section className="bg-white rounded-2xl shadow p-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Upcoming Interviews</h3>
                  <ul className="space-y-3 text-sm">
                    {upcoming.map((iv, idx) => (
                      <li key={idx} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{iv.title}</div>
                          <div className="text-gray-600">{new Date(iv.scheduledAt).toLocaleString()} — {iv.location || 'Online'}</div>
                        </div>
                        {iv.meetingLink && (
                          <a href={iv.meetingLink} className="px-3 py-1 rounded bg-indigo-600 text-white" target="_blank" rel="noreferrer">Join</a>
                        )}
                      </li>
                    ))}
                    {upcoming.length === 0 && <li className="text-gray-600">No upcoming interviews.</li>}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
      {showApplied && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 overflow-auto" onClick={()=> setShowApplied(false)}>
          <div className="p-6 flex justify-center">
            <div onClick={(e)=> e.stopPropagation()} className="w-full max-w-5xl">
              <AppliedPersons inline onOpenPassed={()=>{ setShowApplied(false); setShowPassed(true); }} jobIdFilter={selectedJobForApplied} />
            </div>
          </div>
        </div>
      )}

      {showPassed && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 overflow-auto" onClick={()=> setShowPassed(false)}>
          <div className="p-6 flex justify-center">
            <div onClick={(e)=> e.stopPropagation()} className="w-full max-w-5xl">
              <PassedCandidates />
            </div>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 overflow-auto" onClick={()=> setShowNotifications(false)}>
          <div className="p-6 flex justify-center">
            <div onClick={(e)=> e.stopPropagation()} className="w-full max-w-4xl">
              <Notifications />
            </div>
          </div>
        </div>
      )}

      {showSaved && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 overflow-auto" onClick={()=> setShowSaved(false)}>
          <div className="p-6 flex justify-center">
            <div onClick={(e)=> e.stopPropagation()} className="w-full max-w-5xl">
              <SavedJobs />
            </div>
          </div>
        </div>
      )}

      {showApplications && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 overflow-auto" onClick={()=> setShowApplications(false)}>
          <div className="p-6 flex justify-center">
            <div onClick={(e)=> e.stopPropagation()} className="w-full max-w-5xl">
              <div className="min-h-[40vh] bg-white rounded-2xl shadow p-6">
                <h1 className="text-2xl font-bold mb-4">Applications</h1>
                <div className="space-y-3">
                  {appliedJobs.map((app, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-l-4 border-indigo-500">
                      <div>
                        <div className="font-semibold text-gray-900">{app.jobTitle || 'Job Title'}</div>
                        <div className="text-sm text-gray-600">{app.company || 'Company'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`text-sm font-bold px-3 py-1 rounded-full text-xs ${
                          app.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                          app.status === 'Interview' ? 'bg-green-100 text-green-700' :
                          app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status || 'Applied'}
                        </div>
                        {app.applicantEmail && (
                          <div className="text-xs text-gray-500 mt-1">
                            {app.applicantEmail}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {appliedJobs.length === 0 && (
                    <div className="text-gray-600">No applications yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidate;

