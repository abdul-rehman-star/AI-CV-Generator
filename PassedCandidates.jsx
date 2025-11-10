import React, { useEffect, useState } from "react";

const PassedCandidates = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const companyId = localStorage.getItem("userEmail") || localStorage.getItem("user") || "";
        const res = await fetch(`/api/tests/passed/by-company/${encodeURIComponent(companyId)}`);
        const data = await res.json().catch(() => []);
        if (!ignore) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load passed candidates");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Candidates who passed tests</h1>
        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-2">User</th>
                <th className="py-2">Job ID</th>
                <th className="py-2">Score</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="py-2">{r.userId}</td>
                  <td className="py-2">{r.jobId}</td>
                  <td className="py-2">{r.score}/{r.total}</td>
                  <td className="py-2">
                    <a
                      href={`/applications?jobId=${encodeURIComponent(r.jobId)}&userId=${encodeURIComponent(r.userId)}`}
                      className="px-3 py-1 rounded bg-indigo-600 text-white"
                    >
                      View application
                    </a>
                  </td>
                </tr>
              ))}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td className="py-3" colSpan={4}>No candidates have passed tests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PassedCandidates;


