import React, { useEffect, useState } from "react";

const Notifications = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const role = localStorage.getItem("userRole") || "seeker";
      const email = localStorage.getItem("userEmail") || localStorage.getItem("user") || "";

      if (role === "poster") {
        const companyId = email;
        try {
          const jobsRes = await fetch(`/api/jobs`);
          const jobsAll = await jobsRes.json().catch(() => []);
          const myJobs = Array.isArray(jobsAll) ? jobsAll.filter(j => (j.postedByEmail || "").toLowerCase() === companyId.toLowerCase()) : [];
          const jobIds = myJobs.map(j => j._id || j.id).filter(Boolean);
          if (jobIds.length) {
            const appsRes = await fetch(`/api/applications/by-jobs?jobIds=${encodeURIComponent(jobIds.join(","))}`);
            const apps = await appsRes.json().catch(() => ({ total: 0 }));
            if (Number(apps.total || 0) > 0) {
              setItems((prev) => [{ type: "application", text: `${apps.total} new application(s) received.` }, ...prev]);
            }
          }
        } catch {}
        try {
          const testsRes = await fetch(`/api/tests/by-company/${encodeURIComponent(companyId)}`);
          const tests = await testsRes.json().catch(() => []);
          if (Array.isArray(tests) && tests.length > 0) {
            setItems((prev) => [{ type: "test", text: `Some candidates completed your tests. Review results.` }, ...prev]);
          }
        } catch {}
      } else {
        // seeker role
        try {
          const jobsRes = await fetch(`/api/jobs`);
          const jobsAll = await jobsRes.json().catch(() => []);
          if (Array.isArray(jobsAll) && jobsAll.length) {
            setItems((prev) => [{ type: "job", text: `${jobsAll.length} job(s) available. Check new postings.` }, ...prev]);
          }
        } catch {}
        try {
          // Meeting schedules: any interviews accepted for the seeker (by email) across jobs
          const ivUser = await fetch(`/api/interviews/by-company/${encodeURIComponent(email)}`);
          const ivAsCompany = await ivUser.json().catch(() => []);
          if (Array.isArray(ivAsCompany) && ivAsCompany.length) {
            setItems((prev) => [{ type: "meeting", text: `Some meetings are scheduled. Check Interviews.` }, ...prev]);
          }
        } catch {}
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <ul className="space-y-3">
          {items.map((n, idx) => (
            <li key={idx} className="p-4 rounded-lg bg-gray-50 border">
              {n.text}
            </li>
          ))}
          {items.length === 0 && <li className="text-gray-600">No notifications.</li>}
        </ul>
      </div>
    </div>
  );
};

export default Notifications;


