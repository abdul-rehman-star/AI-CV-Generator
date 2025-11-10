import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import previewLogo from "../assets/Preview.png";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const firstFocusableRef = useRef(null);
  
  const handleLogout = () => {
    try {
      // Clear auth-related data
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("user_name");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("user_name");
      sessionStorage.removeItem("userName");
      // Close mobile menu if open
      setIsOpen(false);
    } finally {
      // Hard reload to ensure UI reflects logged-out state
      window.location.href = "/";
    }
  };

  const toggleMenu = () => {
    setIsOpen((v) => !v);
  };

  // Close on ESC and basic focus handling for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "Tab" && firstFocusableRef.current) {
        // keep focus within drawer when only one primary focusable
        const active = document.activeElement;
        if (!document.getElementById("mobile-drawer")?.contains(active)) {
          firstFocusableRef.current.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const btnAtMount = menuBtnRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      // return focus to menu button
      try { btnAtMount?.focus?.(); } catch { /* ignore */ }
    };
  }, [isOpen]);

  // Determine user initial from stored name/email
  const storedName =
    localStorage.getItem("userName") ||
    localStorage.getItem("user_name") ||
    sessionStorage.getItem("userName") || "";
  const storedEmail =
    localStorage.getItem("userEmail") ||
    sessionStorage.getItem("userEmail") ||
    localStorage.getItem("user") ||
    sessionStorage.getItem("user") || "";
  const displaySource = (storedName || storedEmail).trim();
  const userInitial = displaySource ? displaySource.charAt(0).toUpperCase() : "";
  const isLoggedIn = Boolean(displaySource);

  const InitialBadge = () => (
    <div
      className="w-9 h-9 rounded-full bg-transparent text-gray-900 flex items-center justify-center font-semibold border border-gray-300"
      title={displaySource}
    >
      {userInitial}
    </div>
  );

  return (
    <>
    <header className="site-header fixed top-0 left-0 right-0 w-full bg-white z-[2147483647] shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-4 px-3 md:px-0">
        {/* Brand (left) */}
        <a href="/" className=" bg-transparent">
          <img src={previewLogo} alt="CareerCraft" className="h-14 w-28 md:h-20 md:w-32 object-contain bg-transparent" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-grow justify-center nav">
          <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to="/jobs" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Jobs</NavLink>
          <NavLink to="/profile" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
          <NavLink to="/cv-generator" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>CV Generator</NavLink>
          <NavLink to="/candidate" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Candidate</NavLink>
          <NavLink to="/Details" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}></NavLink>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-5">
          {isLoggedIn && <InitialBadge />}
          {!isLoggedIn ? (
            <>
              <NavLink to="/login" className="text-xl font-bold ">Login</NavLink>
              <NavLink to="/register" className="btn bg-[#3e3f4a] p-2 rounded-2xl text-white text-xl">Sign up</NavLink>
            </>
          ) : (
            <button onClick={handleLogout} className="inline-flex items-center gap-2 p-2.5 rounded-2xl text-gray-800 text-xl">
              <FaSignOutAlt size={20} />
              <span>Log out</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            ref={menuBtnRef}
            onClick={toggleMenu}
            aria-controls="mobile-drawer"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="focus:outline-none"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Drawer placed OUTSIDE header so it sits below the header bar like YouTube */}
    <div
      className={`md:hidden fixed inset-0 z-[2147483648] transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`absolute inset-0 bg-white transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Drawer */}
      <nav
        id="mobile-drawer"
        className={`fixed top-0 left-0 h-full bg-white z-[2147483649] shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col w-[300px] max-w-[86%] sm:w-[340px] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-4 py-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            {userInitial && <InitialBadge />}
            {displaySource && <span className="text-sm text-black truncate max-w-[120px]">{displaySource}</span>}
          </div>
          <button onClick={() => setIsOpen(false)} aria-label="Close menu" className="p-2">
            <FaTimes />
          </button>
        </div>
        {/* Quick tags grid - 5 columns */}
        <div className="px-3 pt-3 pb-1 ">
          
        </div>
        <div className="flex-1 overflow-auto py-2" ref={firstFocusableRef} tabIndex={-1}>
          <NavLink to="/" end className="block px-4 py-3 text-black hover:bg-gray-100" onClick={toggleMenu}>Home</NavLink>
          <NavLink to="/jobs" className="block px-4 py-3 text-black hover:bg-gray-100" onClick={toggleMenu}>Jobs</NavLink>
          <NavLink to="/profile" className="block px-4 py-3 text-black hover:bg-gray-100" onClick={toggleMenu}>Profile</NavLink>
          <NavLink to="/cv-generator" className="block px-4 py-3 text-black hover:bg-gray-100" onClick={toggleMenu}>CV Generator</NavLink>
          <NavLink to="/candidate" className="block px-4 py-3 text-black hover:bg-gray-100" onClick={toggleMenu}>Candidate</NavLink>
        </div>
        <div className="border-t px-4 py-3">
          {!isLoggedIn ? (
            <div className="space-y-2">
              <NavLink to="/login" className="block w-full text-center py-2 rounded-lg border" onClick={toggleMenu}>Login</NavLink>
              <NavLink to="/register" className="block w-full text-center py-2 rounded-lg bg-[#3e3f4a] text-white" onClick={toggleMenu}>Sign up</NavLink>
            </div>
          ) : (
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-center py-2 rounded-lg text-black">
              <FaSignOutAlt size={18} />
              <span>Log out</span>
            </button>
          )}
        </div>
      </nav>
    </div>
    {/* spacer to offset fixed header height across all pages */}
    </>
  );
};

export default Header;
