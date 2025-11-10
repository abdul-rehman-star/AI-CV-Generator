import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SkillAssessmentResults = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const result = state || { total: 0, score: 0, timeTaken: 0 };

  const percent = result.total ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold text-black mb-2">Assessment Results</h1>
        <p className="text-gray-600 mb-6">Great job completing the test.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded bg-gray-100">
            <div className="text-3xl font-bold text-black">{result.score}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div className="p-4 rounded bg-gray-100">
            <div className="text-3xl font-bold text-black">{result.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="p-4 rounded bg-gray-100">
            <div className="text-3xl font-bold text-black">{percent}%</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={() => navigate(-1)} className="px-5 py-2 rounded border border-gray-300 text-black">
            Review
          </button>
          <button onClick={() => navigate("/dashboard")} className="px-5 py-2 rounded bg-black text-white">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillAssessmentResults;


