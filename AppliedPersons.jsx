import React, { useEffect, useState } from "react";

const AppliedPersons = ({ inline, onOpenPassed, jobIdFilter }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apps, setApps] = useState([]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const companyId = localStorage.getItem("userEmail") || localStorage.getItem("user") || "";
        let jobIds = [];
        if (jobIdFilter) {
          // When a specific job was clicked, use it directly (don't filter by company)
          jobIds = [jobIdFilter];
        } else {
          // Otherwise, load all jobs for this company
          const jobsRes = await fetch(`/api/jobs`);
          const jobsAll = await jobsRes.json().catch(() => []);
          const myJobs = Array.isArray(jobsAll) ? jobsAll.filter(j => (j.postedByEmail || "").toLowerCase() === companyId.toLowerCase()) : [];
          jobIds = myJobs.map(j => j._id || j.id).filter(Boolean);
        }
        if (!jobIds.length) {
          if (!ignore) setApps([]);
          return;
        }
        const res = await fetch(`/api/applications/list-by-jobs?jobIds=${encodeURIComponent(jobIds.join(","))}`);
        const data = await res.json().catch(() => []);
        if (!ignore) setApps(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load applicants");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, [jobIdFilter]);

  const [form, setForm] = useState({ candidateEmail: "", date: "", time: "", mode: "Google Meet", link: "", location: "Online" });
  const [scheduling, setScheduling] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const openResumeSafe = (resumeUrl) => {
    try {
      if (!resumeUrl) return;
      if (resumeUrl.startsWith("data:")) {
        // Convert data URL to Blob and open in a new tab to avoid router interception
        const commaIdx = resumeUrl.indexOf(",");
        const meta = resumeUrl.substring(5, commaIdx); // e.g. application/pdf;base64
        const b64 = resumeUrl.substring(commaIdx + 1);
        const isBase64 = /;base64$/i.test(meta) || /;base64;/i.test(meta);
        const mime = meta.replace(/;base64/i, "") || "application/octet-stream";
        let blob;
        if (isBase64) {
          const byteStr = atob(b64);
          const len = byteStr.length;
          const u8 = new Uint8Array(len);
          for (let i = 0; i < len; i++) u8[i] = byteStr.charCodeAt(i);
          blob = new Blob([u8], { type: mime });
        } else {
          blob = new Blob([decodeURIComponent(b64)], { type: mime });
        }
        const url = URL.createObjectURL(blob);
        const w = window.open(url, "_blank", "noopener,noreferrer");
        if (!w) {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.download = resumeFileNameFromMime(mime);
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
        // Revoke after a delay to allow loading
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const w2 = window.open(resumeUrl, "_blank", "noopener,noreferrer");
        if (!w2) {
          const a = document.createElement('a');
          a.href = resumeUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.click();
        }
      }
    } catch (e) {
      window.appToast && window.appToast("Unable to open resume", "error");
    }
  };

  const resumeFileNameFromMime = (mime) => {
    const ext = mime.includes('pdf') ? 'pdf' : mime.includes('msword') || mime.includes('wordprocessingml') ? 'docx' : 'bin';
    return `resume.${ext}`;
  };

  const openSchedule = (email) => {
    setForm((f) => ({ ...f, candidateEmail: email }));
    setTimeout(() => setShowSchedule(true), 0);
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    try {
      setScheduling(true);
      const companyId = localStorage.getItem("userEmail") || localStorage.getItem("user") || "";
      const jobsRes = await fetch(`/api/jobs`);
      const jobsAll = await jobsRes.json().catch(() => []);
      const myJobs = Array.isArray(jobsAll) ? jobsAll.filter(j => (j.postedByEmail || "").toLowerCase() === (companyId || "").toLowerCase()) : [];
      const jobId = myJobs?.[0]?._id || myJobs?.[0]?.id;
      if (!jobId) throw new Error("No job found to schedule against");

      const iso = new Date(`${form.date}T${form.time}:00`).toISOString();
      const payload = {
        jobId,
        companyId,
        candidateEmail: form.candidateEmail,
        title: `Interview for ${myJobs?.[0]?.title || "Job"}`,
        scheduledAt: iso,
        location: form.location,
        meetingLink: form.link,
        mode: form.mode,
      };
      const res = await fetch(`/api/interviews/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to schedule interview");
      window.appToast && window.appToast("Interview scheduled and saved.", "success");
      // Increment poster's interviews counter for live dashboard update
      try {
        const current = parseInt(localStorage.getItem("interviewsCount") || "0", 10) || 0;
        localStorage.setItem("interviewsCount", String(current + 1));
        window.dispatchEvent(new StorageEvent("storage", { key: "interviewsCount", newValue: String(current + 1) }));
      } catch {}
      setShowSchedule(false);
    } catch (err) {
      window.appToast && window.appToast(err?.message || "Failed to schedule interview", "error");
    } finally {
      setScheduling(false);
    }
  };

  const content = (
    <>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Applied persons</h1>
        <div className="mb-4">
          <button
            onClick={onOpenPassed}
            className="inline-block px-4 py-2 rounded bg-green-600 text-white text-sm"
          >
            View candidates who passed tests
          </button>
        </div>
        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <ul className="divide-y">
          {apps.map((a) => (
            <li key={a._id} className="py-4 flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">{a.applicantName}</div>
                <div className="text-sm text-gray-600">{a.applicantEmail}</div>
                <div className="text-sm text-gray-500">Job ID: {a.jobId}</div>
                {a.resumeUrl && (
                  <button onClick={() => openResumeSafe(a.resumeUrl)} className="text-indigo-600 text-sm underline">View Resume</button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => openSchedule(a.applicantEmail)} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Schedule</button>
                <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            </li>
          ))}
          {!loading && !error && apps.length === 0 && (
            <li className="py-4 text-gray-600">No applications yet.</li>
          )}
        </ul>
      </div>

      {/* Schedule Modal (slide-in from right then centered) */}
      {showSchedule && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={()=> setShowSchedule(false)}>
          <div
            onClick={(e)=> e.stopPropagation()}
            className="w-[32rem] max-w-full bg-white rounded-2xl shadow-lg overflow-hidden transform transition-transform duration-300 translate-x-0 animate-[none]"
            style={{ animation: 'slideInToCenter 300ms ease-out forwards' }}
          >
            <form onSubmit={submitSchedule} className="p-6 space-y-3">
              <h3 className="text-lg font-semibold">Schedule Interview</h3>
              <div>
                <label className="block text-sm mb-1">Candidate Email</label>
                <input value={form.candidateEmail} onChange={(e)=>setForm(f=>({...f,candidateEmail:e.target.value}))} className="w-full border rounded p-2" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e)=>setForm(f=>({...f,date:e.target.value}))} className="w-full border rounded p-2" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Time</label>
                  <input type="time" value={form.time} onChange={(e)=>setForm(f=>({...f,time:e.target.value}))} className="w-full border rounded p-2" required />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Mode</label>
                <select value={form.mode} onChange={(e)=>setForm(f=>({...f,mode:e.target.value}))} className="w-full border rounded p-2">
                  <option>Google Meet</option>
                  <option>Zoom</option>
                  <option>On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Interview Link (optional)</label>
                <input value={form.link} onChange={(e)=>setForm(f=>({...f,link:e.target.value}))} className="w-full border rounded p-2" placeholder="Paste Google Meet/Zoom link" />
              </div>
              <div>
                <label className="block text-sm mb-1">Location</label>
                <input value={form.location} onChange={(e)=>setForm(f=>({...f,location:e.target.value}))} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=> setShowSchedule(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" disabled={scheduling} className="px-4 py-2 rounded bg-indigo-600 text-white">{scheduling?"Scheduling...":"Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 bg-black/0 backdrop-blur-[3px] z-50 p-6 overflow-auto">
      {content}
    </div>
  );
};

export default AppliedPersons;


