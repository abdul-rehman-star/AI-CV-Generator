import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Support backend redirecting to /welcome?... as well as /oauth/callback
    const search = location.search || window.location.search;
    const params = new URLSearchParams(search);
    const email = params.get("email") || params.get("e") || "oauth.user@example.com";
    const name = params.get("name") || "Google User";
    const id = params.get("id") || params.get("uid") || "";

    // Persist a simple auth marker
    localStorage.setItem("user", email);
    localStorage.setItem("user_name", name);
    if (id) localStorage.setItem("user_id", id);

    navigate("/Candidate", { replace: true });
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Signing you in…</div>
    </div>
  );
};

export default OAuthCallback;


