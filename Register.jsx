// src/components/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // ✅ added Link
import PersonalInfoForm from "./PersonalInfoForm.jsx";
import ContactInfoForm from "./ContactInfoForm.jsx";
import OTPVerification from "./OTPVerification.jsx";
import { FaGoogle, FaLinkedin } from "react-icons/fa";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Using server-side Google OAuth via backend `/auth/google`.

  const handleGoogleSignup = () => {
    setError("");
    // Start real Google OAuth via backend; backend should redirect back to /oauth/callback on success
    window.location.href = "/auth/google";
  };

  const handleLinkedInSignup = () => {
    const clientId = import.meta?.env?.VITE_LINKEDIN_CLIENT_ID;
    const redirectUri =
      import.meta?.env?.VITE_LINKEDIN_REDIRECT_URI || `${window.location.origin}/linkedin-callback`;
    if (!clientId) {
      setError("LinkedIn Client ID missing. Set VITE_LINKEDIN_CLIENT_ID in .env");
      return;
    }
    const state = (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) || String(Date.now());
    const scope = "r_liteprofile r_emailaddress";

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  const handleNextStep = (data, goNext = true) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (goNext) setStep((prev) => prev + 1);
    setError("");
  };

  const handlePreviousStep = () => {
    setStep((prev) => prev - 1);
    setError("");
  };

  const handleRegister = async ({ otp }) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (otp === "123456") {
        setSuccess("Registration successful! Redirecting to your dashboard...");
        // Mock auth: persist a simple user marker so protected routes open
        const userMarker = formData?.email || "newuser@example.com";
        localStorage.setItem("user", userMarker);
        // Go to Candidate page immediately
        navigate("/Candidate", { replace: true });
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PersonalInfoForm onNext={handleNextStep} initialData={formData} />;
      case 2:
        return (
          <ContactInfoForm
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            initialData={formData}
          />
        );
      case 3:
        return (
          <OTPVerification
            onVerify={handleRegister}
            onPrevious={handlePreviousStep}
            loading={loading}
            error={error}
            success={success}
          />
        );
      default:
        return <PersonalInfoForm onNext={handleNextStep} initialData={formData} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="app-card p-8 w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className=" text-2xl md:text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <div className="space-y-4 mb-8">
          
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex items-center justify-center gap-3 w-full py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            >
              <FaGoogle className="text-red-500" />
              <span className="font-medium text-gray-700">Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={handleLinkedInSignup}
              className="flex items-center justify-center gap-3 w-full py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            >
              <FaLinkedin className="text-blue-600" />
              <span className="font-medium text-gray-700">Continue with LinkedIn</span>
            </button>
            {/* Google OAuth is server-side; no email preview needed here */}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-200 w-full" />
            <span className="text-xs uppercase tracking-wider text-gray-400">or</span>
            <div className="h-px bg-gray-200 w-full" />
          </div>
          <p className="text-xs text-gray-500 text-center">
            By choosing Google or LinkedIn, we’ll securely fetch your basic profile
            information to fast-track account creation. You can review and complete
            any missing details afterward.
          </p>
        </div>
        {renderStep()}
        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
