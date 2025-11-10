import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
 
import { FaUser, FaLock } from 'react-icons/fa'; // Import icons

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState(""); // State for role selection
  const [error, setError] = useState(""); // State for login errors
  const [success, setSuccess] = useState(""); // State for success message
  const [loading, setLoading] = useState(false); // State for loading
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate role selection
    if (!selectedRole) {
      setError("Please select your role before logging in.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error || "Invalid email or password. Please try again.";
        setError(message);
        setLoading(false);
        return;
      }

      const storage = rememberMe ? localStorage : sessionStorage;
      if (data?.token) storage.setItem("authToken", data.token);
      if (data?.email) {
        storage.setItem("userEmail", data.email);
        // Legacy key used by PrivateRoute isAuthenticated()
        storage.setItem("user", data.email);
      }
      if (data?.name) storage.setItem("userName", data.name);
      if (data?.id) storage.setItem("userId", data.id);
      
      // Save selected role
      storage.setItem("userRole", selectedRole);

      // Navigate to Candidate dashboard based on role - don't go to landing page
      setSuccess("Successfully logged in. Redirecting to dashboard...");
      setTimeout(() => navigate("/Candidate"), 1200);
    } catch {
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Stay on login even if already authenticated to allow switching accounts.

  return (
    <div className="flex items-center justify-center min-h-screen  p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FaUser className="text-gray-400" />
              </span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition duration-200"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FaLock className="text-gray-400" />
              </span>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition duration-200"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("seeker")}
                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedRole === "seeker"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedRole === "seeker" ? "border-indigo-600" : "border-gray-400"
                  }`}>
                    {selectedRole === "seeker" && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                  <span className="font-medium">I want to find a job</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("poster")}
                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedRole === "poster"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedRole === "poster" ? "border-indigo-600" : "border-gray-400"
                  }`}>
                    {selectedRole === "poster" && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                  <span className="font-medium">I want to post a job</span>
                </div>
              </button>
            </div>
            {!selectedRole && (
              <p className="text-red-500 text-xs mt-1">Please select a role to continue</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-2">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition duration-200">
              Forgot Password?
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-center text-sm font-medium bg-red-100 p-2 rounded-md">
              {error}
            </div>
          )}
          {/* Success Message */}
          {success && (
            <div className="text-green-700 text-center text-sm font-medium bg-green-100 p-2 rounded-md">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center space-x-2"
            disabled={loading}
          >
            <span>{loading ? "Logging in..." : "Login"}</span>
          </button>
        </form>

        {/* Link to Registration */}
        <p className="mt-8 text-center text-gray-600 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition duration-200">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;