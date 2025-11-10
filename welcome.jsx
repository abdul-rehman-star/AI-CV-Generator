import React from 'react';
import { useNavigate } from 'react-router-dom';
import searchImage from '../assets/search.jpg';
import applyImage from '../assets/Apply.jpg';
import hiredImage from '../assets/Hired.png';

const WelcomePage = () => {
  const navigate = useNavigate();

  const [rolePromptOpen, setRolePromptOpen] = React.useState(false);
  // Key Metrics animation state
  const metricsRef = React.useRef(null);
  const metricTargets = React.useRef([67, 82, 43, 50]);
  const [metricValues, setMetricValues] = React.useState([0, 0, 0, 0]);
  const [metricsInView, setMetricsInView] = React.useState(false);
  const lastTargetRef = React.useRef('zero'); // 'zero' | 'target'
  const animRafRef = React.useRef(0);
  // How It Works typewriter state
  const howRef = React.useRef(null);
  const howTargets = React.useRef(["How It Works", "Create Profile", "Search Jobs", "Apply", "Get Hired"]);
  const [howTyped, setHowTyped] = React.useState(["How It Works", "", "", "", ""]);
  const howTypingRef = React.useRef(false);
  // Hero typewriter removed (static heading)

  // If Google redirects to /welcome?..., immediately route to Candidate after storing info
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("email") || params.has("id")) {
      const email = params.get("email") || "oauth.user@example.com";
      const name = params.get("name") || "Google User";
      localStorage.setItem("user", email);
      localStorage.setItem("user_name", name);
      // After login, ask for role if not set
      const existingRole = localStorage.getItem("userRole");
      if (!existingRole) {
        setRolePromptOpen(true);
      }
    }
  }, [navigate]);

  // Observe when the Key Metrics section enters viewport, then animate 0% -> target
  React.useEffect(() => {
    if (!metricsRef.current) return;
    const el = metricsRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setMetricsInView(true);
          } else {
            setMetricsInView(false);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Generic animator from current values to a target array
  const animateTo = React.useCallback((toValues, durationMs = 1200) => {
    cancelAnimationFrame(animRafRef.current);
    const from = metricValues.slice();
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const next = from.map((v, i) => Math.round(v + (toValues[i] - v) * eased));
      setMetricValues(next);
      if (progress < 1) {
        animRafRef.current = requestAnimationFrame(step);
      }
    };
    animRafRef.current = requestAnimationFrame(step);
  }, [metricValues]);

  // When section enters viewport → animate up to targets
  React.useEffect(() => {
    if (metricsInView && lastTargetRef.current !== 'target') {
      animateTo(metricTargets.current, 1200);
      lastTargetRef.current = 'target';
    }
  }, [metricsInView, animateTo]);

  // When section leaves viewport completely → animate back to zero
  React.useEffect(() => {
    if (!metricsInView && lastTargetRef.current !== 'zero') {
      animateTo([0, 0, 0, 0], 500);
      lastTargetRef.current = 'zero';
    }
  }, [metricsInView, animateTo]);

  // Detect when section scrolls above viewport → animate back to zero
  React.useEffect(() => {
    const onScroll = () => {
      const el = metricsRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const isAbove = rect.bottom < 0; // section has moved above the viewport
      if (isAbove && lastTargetRef.current !== 'zero') {
        animateTo([0, 0, 0, 0], 800);
        lastTargetRef.current = 'zero';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [animateTo]);

  const chooseRole = (role) => {
    // role: 'seeker' | 'poster'
    localStorage.setItem("userRole", role);
    setRolePromptOpen(false);
    navigate("/Candidate");
  };

  const requireRoleThenNavigate = (path) => {
    const hasRole = Boolean(localStorage.getItem("userRole"));
    if (!hasRole) {
      setRolePromptOpen(true);
    } else {
      navigate(path);
    }
  };

  // Typewriter for How It Works headings
  const startHowTyping = React.useCallback(() => {
    if (howTypingRef.current) return;
    howTypingRef.current = true;
    const typeOne = (idx, ch = 0) => {
      const full = howTargets.current[idx];
      if (idx === 1 && ch === 0) setHowTyped([howTargets.current[0], "", "", "", ""]);
      if (ch <= full.length) {
        setHowTyped((t) => {
          const next = t.slice();
          next[idx] = full.slice(0, ch);
          return next;
        });
        setTimeout(() => typeOne(idx, ch + 1), 25);
      } else if (idx < 4) {
        setTimeout(() => typeOne(idx + 1, 0), 120);
      } else {
        howTypingRef.current = false;
      }
    };
    typeOne(1, 0);
  }, []);

  React.useEffect(() => {
    const el = howRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startHowTyping();
        } else {
          howTypingRef.current = false;
          setHowTyped([howTargets.current[0], "", "", "", ""]);
        }
      });
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [startHowTyping]);

  // Removed hero typewriter effects
  return (
    <>
      {/* Role selection prompt shown once after login if no role chosen */}
      {rolePromptOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Tell us what you want to do</h3>
            <p className="text-gray-600 mb-5">Choose your role to continue</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => chooseRole('seeker')}
                className="rounded-xl border border-gray-200 p-4 text-left hover:border-indigo-400 hover:shadow transition"
              >
                <div className="text-lg font-semibold text-gray-900">I want to find a job</div>
                <div className="text-sm text-gray-600 mt-1">Browse and apply to jobs</div>
              </button>
              <button
                onClick={() => chooseRole('poster')}
                className="rounded-xl border border-gray-200 p-4 text-left hover:border-indigo-400 hover:shadow transition"
              >
                <div className="text-lg font-semibold text-gray-900">I want to post a job</div>
                <div className="text-sm text-gray-600 mt-1">Create and manage listings</div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-36 pb-16 md:pt-65 md:pb-24 flex flex-col items-center text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Title and Subtitle */}
          <h1 className="text-4xl md:text-7xl font-black  mt-15 text-gray-900 transform -skew-y-1 uppercase tracking-wider">
            <span className="text-black">Find Your Dream Job</span>
            <br />
            <span className="text-[#3e3f4a] "> in Pakistan</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mt-4 mx-auto">
            Discover new opportunities and connect with a community of professionals.
            Your journey to career success starts here.
          </p>

          {/* Call-to-action Buttons */}
          <div className="flex flex-col gap-4 justify-center mb-12">
            {/* First row - Find Jobs and Post Job buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => requireRoleThenNavigate('/jobs')} className="px-10 py-3 text-white bg-gray-900 font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                Find Jobs
              </button>
              <button onClick={() => requireRoleThenNavigate('/post-job')} className="px-10 py-3 bg-white text-gray-900 border border-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                Post a Job
              </button>
            </div>
            {/* Second row - Choose Role button centered */}
            <div className="flex justify-center">
              <button onClick={() => setRolePromptOpen(true)} className="px-10 py-3 bg-[#3e3f4a] text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Choose Role
              </button>
            </div>
          </div>
        </div>

        {/* Image Mockup Section */}
        <div className="mt-8 relative max-w-[1100px] mx-auto w-full">
          <div className="relative">
            {/* The main phone mockup image */}
            <img src={searchImage} alt="App screens mockup" className="w-full max-w-[1100px] mx-auto rounded-2xl object-contain" />
          </div>
        </div>

        {/* Key Metrics Section */}
        <div ref={metricsRef} className="bg-[#f2f2f2] py-16 mt-16 rounded-3xl">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="font-extrabold">KEY METRICS</span> <span className="font-light">SLIDE</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Key Metric 01 */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="none"
                    />
                  {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3e3f4a"
                      strokeWidth="8"
                      fill="none"
                    strokeDasharray={`${metricValues[0] * 2.51} 251.2`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{metricValues[0]}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Job Posted</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Registered company post Job related our work .
                </p>
              </div>

              {/* Key Metric 02 */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3e3f4a"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${metricValues[1] * 2.51} 251.2`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{metricValues[1]}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Registered Company</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                Verified companies actively post jobs and review candidate CVs, ensuring genuine opportunities
                </p>
              </div>

              {/* Key Metric 03 */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3e3f4a"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${metricValues[2] * 2.51} 251.2`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{metricValues[2]}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Active user</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                Thousands of job seekers rely on our CV generator and job portal for career growth.
                </p>
              </div>

              {/* Key Metric 04 */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f4f4f8"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3e3f4a"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${metricValues[3] * 2.51} 251.2`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{metricValues[3]}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Success Rate</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                A high percentage of users successfully secure interviews after using our CV builder.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "Ready to advance your career?" section - Re-styled to fit the new design */}
      <div className="bg-gray-100 py-19 mt-12">
        <div className="max-w-[1150px] mx-auto px-6">
          <div className="bg-white p-8 md:p-12 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">Ready to advance your career?</h2>
                <p className="mb-6 text-gray-600">Join thousands of professionals who found their dream jobs through Rozgar.pk</p>
                <button
                  onClick={() => navigate("/profile")}
                  className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Create Your Profile
                </button>
              </div>
              <div className="hidden md:block">
                {/* Job listing cards go here */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="font-semibold text-gray-900">Software Engineer</div>
                        <div className="text-sm text-gray-500">Karachi, Pakistan</div>
                      </div>
                    </div>
                    <div className="text-gray-900 font-bold">$3k-$5k</div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="font-semibold text-gray-900">Marketing Manager</div>
                        <div className="text-sm text-gray-500">Lahore, Pakistan</div>
                      </div>
                    </div>
                    <div className="text-gray-900 font-bold">$2k-$4k</div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <button className="text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors">View all jobs →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The rest of your sections (How It Works, Footer) remain the same. */}
      
      {/* Features Section */}
      <div className="bg-white py-16" ref={howRef}>
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">{howTyped[0]}</h2>
          <p className="text-gray-600 text-center max-w-2xl text-2xl mx-auto mb-12">Get your dream job in 4 simple steps</p>

          {/* Step 1 - Image Left, Text Right */}
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 items-center mb-13">
            <div className="order-1">
              <img src={applyImage} alt="Apply form" className="w-full rounded-2xl shadow object-cover" />
            </div>
            <div className="order-2">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-[black] text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-2xl mb-3">{howTyped[1]}</h3>
              <p className="text-black text-[19px]">When creating your professional profile, you'll go through a multi-step process to ensure it's complete and showcases your abilities. First, you'll provide your  personal information, followed by your education details. The next steps involve adding your work experience and listing your skills and certifications.</p>
            </div>
          </div>

          {/* Step 2 - Text Left, Image Right */}
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 items-center mb-10">
            <div className="order-2 md:order-1">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-black text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-2xl mb-3">{howTyped[2]}</h3>
              <p className="text-gray-800 text-[19px]">Browsing through thousands of job listings is simple with the platform's features. You can use the filter sidebar to narrow down jobs by skills, salary, job type, and location. If you know what you're looking for, you can use the search functionality to find specific roles. The job cards show key information at a glance, and you can use the pagination to go through all the listings.Once you find an interesting job, a single click on the  </p>
            </div>
            <div className="order-1 md:order-2">
              <img src={searchImage} alt="Search jobs" className="w-full h-[320px] md:h-[450px] rounded-2xl shadow object-cover object-center" />
            </div>
          </div>

          {/* Step 3 - Image Left, Text Right */}
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 items-center mb-10">
            <div className="order-1">
              <img src={applyImage} alt="Apply easily" className="w-full rounded-2xl shadow object-cover" />
            </div>
            <div className="order-2">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-black text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-2xl mb-3">{howTyped[3]}</h3>
              <p className="text-gray-800 text-[19px]" >Submit applications with one click and track your progress in the dashboard  Easily manage and review you Full Application  , and  stay updated on Their status.ob Details Modal or page to see the full job description and a helpful requirements matching indicator. You can even</p>
            </div>
          </div>

          {/* Step 4 - Text Left, Image Right */}
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-black text-xl font-bold">4</span>
              </div>
              <h3 className="font-semibold text-2xl mb-3">{howTyped[4]}</h3>
              <p className="text-gray-800 text-[18px]"> our application journey doesn't end with a click; it moves into the next phase: securing your new role.you can view an application status timeline that tracks each of your applications through stages like "Applied," "Screening," and "Interview".If a company is interested, you'll use the interview scheduling interface to choose a time that works for you from available slots. The platform's</p>
            </div>
            <div className="order-1 md:order-2">
              <img src={hiredImage} alt="Hired" className="w-full h-[320px] md:h-[450px] rounded-2xl shadow object-cover object-center" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Rozgar.pk</h3>
              <p className="text-gray-400">Pakistan's leading job portal connecting talent with opportunities.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-white">Career Resources</a></li>
                <li><a href="#" className="hover:text-white">Resume Builder</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Post a Job</a></li>
                <li><a href="#" className="hover:text-white">Search Candidates</a></li>
                <li><a href="#" className="hover:text-white">Pricing Plans</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <address className="not-italic text-gray-400">
                <p>123 Main Street, Karachi</p>
                <p>Email: info@rozgar.pk</p>
                <p>Phone: +92 300 1234567</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2023 Rozgar.pk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default WelcomePage;