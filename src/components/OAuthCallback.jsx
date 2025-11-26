import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveToken, refreshUser } = useAuth();

  useEffect(() => {
    const search = location.search || window.location.search;
    const params = new URLSearchParams(search);
    const token = params.get("token");

    const completeLogin = async (authToken) => {
      if (authToken) {
        saveToken(authToken, true);
        await refreshUser();
        navigate("/Candidate", { replace: true });
        return;
      }
      // Fallback: send user to welcome page where they can choose role
      navigate("/welcome", { replace: true });
    };

    completeLogin(token);
  }, [location.search, navigate, refreshUser, saveToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Signing you in…</div>
    </div>
  );
};

export default OAuthCallback;


