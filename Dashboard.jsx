import React from "react";
import { BarChart3, Briefcase, Calendar, User } from "lucide-react"; // make sure lucide-react is installed → npm install lucide-react
import AppliedPersons from "./AppliedPersons";
import PassedCandidates from "./PassedCandidates";

const Dashboard = () => {
  const [applications, setApplications] = React.useState(() => parseInt(localStorage.getItem("applicationsCount") || "0", 10) || 0);
  const [interviews, setInterviews] = React.useState(() => parseInt(localStorage.getItem("interviewsCount") || "0", 10) || 0);
  const [savedJobs, setSavedJobs] = React.useState(() => parseInt(localStorage.getItem("savedJobsCount") || "0", 10) || 0);
  const [userRole, setUserRole] = React.useState(() => localStorage.getItem("userRole") || "seeker");

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === "applicationsCount") setApplications(parseInt(localStorage.getItem("applicationsCount") || "0", 10) || 0);
      if (e.key === "interviewsCount") setInterviews(parseInt(localStorage.getItem("interviewsCount") || "0", 10) || 0);
      if (e.key === "savedJobsCount") setSavedJobs(parseInt(localStorage.getItem("savedJobsCount") || "0", 10) || 0);
      if (e.key === "userRole") setUserRole(localStorage.getItem("userRole") || "seeker");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Dynamic labels based on role
  const labelApplications = userRole === "poster" ? "Post jobs" : "Applications";
  const labelInterviews = userRole === "poster" ? "Schedule interviews" : "Interviews";
  const labelOffers = userRole === "poster" ? "Test results" : "Offers";
  const labelSaved = userRole === "poster" ? "Applied persons" : "Saved Jobs";

  const title = userRole === "poster" ? "Company Dashboard" : "Candidate Dashboard";
  const subtitle = userRole === "poster" ? "Manage your postings and interviews." : "Welcome back! Here’s your progress.";

  const [showApplied, setShowApplied] = React.useState(false);
  const [showPassed, setShowPassed] = React.useState(false);
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </header>

      {/* Profile Completion */}
      <div className="bg-white shadow rounded-xl p-4 mb-8">
        <h2 className="text-lg font-semibold mb-2">Profile Completion</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full h-3 bg-gray-200 rounded-full">
              <div
                className="h-3 bg-indigo-500 rounded-full"
                style={{ width: "70%" }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700">70%</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{labelApplications}</p>
            <p className="text-lg font-bold">{applications}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{labelInterviews}</p>
            <p className="text-lg font-bold">{interviews}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
            <User size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{labelOffers}</p>
            <p className="text-lg font-bold">42</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-4 flex items-center gap-4 cursor-pointer" onClick={()=> setShowApplied(true)}>
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{labelSaved}</p>
            <p className="text-lg font-bold">{savedJobs}</p>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <ul className="divide-y divide-gray-200">
          {[
            { company: "Google", role: "Frontend Developer", status: "Interview" },
            { company: "Microsoft", role: "Backend Developer", status: "Applied" },
            { company: "Amazon", role: "Full Stack Developer", status: "Offer" },
          ].map((app, idx) => (
            <li key={idx} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{app.role}</p>
                <p className="text-sm text-gray-500">{app.company}</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                {app.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {showApplied && (
        <div className="fixed inset-0 bg-black/0 backdrop-blur-[3px] z-50 overflow-auto" onClick={()=> setShowApplied(false)}>
          <div className="p-6 flex justify-center">
            <div onClick={(e)=> e.stopPropagation()} className="w-full max-w-5xl">
              <AppliedPersons inline onOpenPassed={()=>{ setShowApplied(false); setShowPassed(true); }} />
            </div>
          </div>
        </div>
      )}

      {showPassed && (
        <div className="fixed inset-0 bg-black/0 backdrop-blur-[3px] z-50 overflow-auto" onClick={()=> setShowPassed(false)}>
          <div className="p-6 flex justify-center">
            <div onClick={(e)=> e.stopPropagation()} className="w-full max-w-5xl">
              <PassedCandidates />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
