import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const formatSeconds = (total) => {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const SkillAssessmentTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const jobId = params.get("jobId");

  const [test, setTest] = useState(null);
  const questions = test?.questions || [];

  const totalTimeSec = test?.durationSec || 6 * 60; // fallback
  const [timeLeft, setTimeLeft] = useState(totalTimeSec);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const hasQuestions = questions.length > 0;
  const current = hasQuestions ? questions[currentIndex] : null;

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!jobId) return;
      try {
        const res = await fetch(`/api/tests/by-job/${jobId}`);
        if (!res.ok) throw new Error("No test for this job");
        const data = await res.json();
        if (!ignore) {
          setTest(data);
          setTimeLeft(data.durationSec || 6 * 60);
        }
      } catch (e) {
        window.appToast && window.appToast(e.message || "Failed to load test", "error");
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [jobId]);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, handleSubmit]);

  const progressPercent = hasQuestions
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  const setAnswer = (qid, index) => {
    setAnswers({ ...answers, [qid]: index });
  };

  const handleSubmit = useCallback(async () => {
    if (!test || questions.length === 0) return;
    try {
      const payload = {
        testId: test?._id,
        jobId: test?.jobId || jobId,
        userId: "anonymous", // TODO: replace with real user id from auth
        answers,
        timeTaken: totalTimeSec - timeLeft,
      };
      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit result");
      const saved = await res.json();
      const result = {
        total: questions.length,
        score: saved.score,
        timeTaken: saved.timeTaken,
        answers,
      };
      navigate("/skills-test/results", { state: result });
    } catch (e) {
      window.appToast && window.appToast(e.message || "Submission failed", "error");
    }
  }, [test, questions.length, jobId, answers, totalTimeSec, timeLeft, navigate]);

  const confirmSubmit = () => {
    if (window.confirm("Submit your answers?")) handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-black">Skill Assessment</h1>
          <div className="px-3 py-1 rounded bg-black text-white" title="Time Left">
            {formatSeconds(timeLeft)}
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded h-2 mb-6">
          <div className="bg-indigo-600 h-2 rounded" style={{ width: `${progressPercent}%` }}></div>
        </div>

        {hasQuestions ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Question {currentIndex + 1} of {questions.length}
            </div>

            <div className="mb-6">
              <p className="text-lg font-medium text-black mb-4">{current.text}</p>
              <div className="space-y-2">
                {current.options.map((opt, idx) => {
                  const selected = answers[current.id] === idx;
                  return (
                    <label
                      key={idx}
                      className={`flex items-center justify-between border rounded p-3 cursor-pointer ${
                        selected ? "border-indigo-600 bg-indigo-50" : "border-gray-300"
                      }`}
                    >
                      <span className="text-black">{opt}</span>
                      <input
                        type="radio"
                        name={`q-${current.id}`}
                        checked={selected}
                        onChange={() => setAnswer(current.id, idx)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="px-5 py-2 rounded border border-gray-300 text-black disabled:opacity-50"
              >
                Previous
              </button>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  className="px-5 py-2 rounded bg-black text-white hover:bg-gray-800"
                >
                  Next
                </button>
              ) : (
                <button onClick={confirmSubmit} className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                  Submit
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-600">{test ? "No questions available for this test." : "Loading test..."}</div>
        )}
      </div>
    </div>
  );
};

export default SkillAssessmentTest;


