import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaGraduationCap,
  FaBriefcase,
  FaStar,
  FaCheckCircle,
} from "react-icons/fa";
import profileImg from "../assets/profile.png";

const ProfileManagement = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    personalInfo: { name: "", email: "", phone: "" },
    education: { degree: "", institution: "", year: "" },
    workExperience: { company: "", role: "", years: "" },
    skills: { skillset: "", certifications: "" },
  });

  // Prefill from auth storage (read-only fields)
  React.useEffect(() => {
    // Load existing profile/draft if present
    try {
      const existing = JSON.parse(localStorage.getItem("userProfile") || localStorage.getItem("profileDraft") || "null");
      if (existing && typeof existing === 'object') {
        setFormData((d) => ({
          personalInfo: { ...d.personalInfo, ...(existing.personalInfo || {}) },
          education: { ...d.education, ...(existing.education || {}) },
          workExperience: { ...d.workExperience, ...(existing.workExperience || {}) },
          skills: { ...d.skills, ...(existing.skills || {}) },
        }));
      }
    } catch { /* ignore */ }

    // Prefill name/email from auth
    const name = localStorage.getItem("userName") || localStorage.getItem("user_name") || "";
    const email = localStorage.getItem("userEmail") || localStorage.getItem("user") || "";
    if (name || email) {
      setFormData((d) => ({ ...d, personalInfo: { ...d.personalInfo, name: d.personalInfo.name || name, email: d.personalInfo.email || email } }));
    }
  }, []);

  // Auto-save draft so Previous retains inputs
  React.useEffect(() => {
    try { localStorage.setItem("profileDraft", JSON.stringify(formData)); } catch { /* ignore */ }
  }, [formData]);

  // Steps with icons
  const steps = [
    { id: 1, name: "Personal Info", icon: FaUser },
    { id: 2, name: "Education", icon: FaGraduationCap },
    { id: 3, name: "Work Experience", icon: FaBriefcase },
    { id: 4, name: "Skills & Certifications", icon: FaStar },
  ];

  // Input change handler
  const handleChange = (section, field, value) => {
    setFormData({
      ...formData,
      [section]: { ...formData[section], [field]: value },
    });
  };

  // Navigation handlers
  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Simple validation: require all Step 1 fields to be filled before moving forward
  const isValidPhone = (phone) => /^\d{11}$/.test(String(phone || '').trim());

  const isStepValid = (currentStep) => {
    if (currentStep === 1) {
      const { name, email, phone } = formData.personalInfo;
      return Boolean(name && email && isValidPhone(phone));
    }
    return true;
  };

  // Auto advance logic for step 1 and 2
  React.useEffect(() => {
    if (step === 1) {
      const { name, email, phone } = formData.personalInfo;
      if (name && email && isValidPhone(phone)) {
        const t = setTimeout(() => nextStep(), 350);
        return () => clearTimeout(t);
      }
    }
    if (step === 2) {
      const { degree, institution, year } = formData.education;
      if (degree && institution && year) {
        const t = setTimeout(() => nextStep(), 350);
        return () => clearTimeout(t);
      }
    }
  }, [step, formData, nextStep]);

  const saveAsDraft = () => {
    localStorage.setItem("profileDraft", JSON.stringify(formData));
    window.appToast && window.appToast("Draft saved successfully ✅", "success");
  };

  const handleSubmit = () => {
    try {
      localStorage.setItem("userProfile", JSON.stringify(formData));
      window.appToast && window.appToast("Profile submitted successfully 🎉", "success");
      // Redirect to CV generator after save
      navigate("/cv-generator");
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  };

  return (
    <div className="min-h-screen p-8 md:p-16">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-start">
        {/* Left column: form */}
        <div className="w-full bg-white rounded-lg p-8">
        <h2 className="text-4xl font-bold text-center text-black mb-8">
          Profile Management
        </h2>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 -z-10 mx-10"></div>
          {steps.map((item) => (
            <div
              key={item.id}
              className="flex-1 flex flex-col items-center relative z-10"
            >
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl transition-colors duration-300 ${
                  step >= item.id ? "bg-gray-300 text-gray-700" : "bg-gray-200 text-gray-500"
                }`}
                onClick={() => setStep(item.id)}
                role="button"
              >
                {step > item.id ? <FaCheckCircle /> : <item.icon />}
              </div>
              <p
                className={`text-sm mt-3 text-center font-semibold transition-colors duration-300 ${
                  step >= item.id ? "text-gray-700" : "text-gray-500"
                }`}
                onClick={() => setStep(item.id)}
                role="button"
              >
                {item.name}
              </p>
            </div>
          ))}
        </div>

        {/* Step Forms */}
        <div className="space-y-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl text-[black] font-semibold mb-4">
                Step 1: Personal Information
              </h3>
              <input
                type="text"
                placeholder="Name"
                className="w-full p-3 border rounded-lg mb-3"
                value={formData.personalInfo.name}
                disabled
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border rounded-lg mb-3"
                value={formData.personalInfo.email}
                disabled
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full p-3 border rounded-lg"
                value={formData.personalInfo.phone}
                onChange={(e) =>
                  handleChange("personalInfo", "phone", e.target.value)
                }
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Step 2: Education Details
              </h3>
              <select
                className="w-full p-3 border rounded-lg mb-3"
                value={formData.education.degree}
                onChange={(e) => handleChange("education", "degree", e.target.value)}
              >
                <option value="">Select Degree</option>
                <option>Matric</option>
                <option>Intermediate</option>
                <option>Diploma</option>
                <option>Bachelor</option>
                <option>Master</option>
                <option>MPhil</option>
                <option>PhD</option>
              </select>
              <input
                type="text"
                placeholder="Institution"
                className="w-full p-3 border rounded-lg mb-3"
                value={formData.education.institution}
                onChange={(e) =>
                  handleChange("education", "institution", e.target.value)
                }
              />
              <select
                className="w-full p-3 border rounded-lg"
                value={formData.education.year}
                onChange={(e) => handleChange("education", "year", e.target.value)}
              >
                <option value="">Select Year</option>
                {Array.from({ length: 60 }).map((_, idx) => {
                  const y = String(new Date().getFullYear() - idx);
                  return (
                    <option key={y} value={y}>{y}</option>
                  );
                })}
              </select>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Step 3: Work Experience
              </h3>
              <DynamicWork formData={formData} setFormData={setFormData} />
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-xl font-semibold mb-21">
                Step 4: Skills & Certifications
              </h3>
              <DynamicSkills formData={formData} setFormData={setFormData} />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Previous
            </button>
          )}

          {step < steps.length && (
            <button
              onClick={() => {
                if (isStepValid(step)) nextStep();
                else window.appToast && window.appToast("Please complete all required fields before proceeding.", "warn");
              }}
              className={`px-6 py-3 border rounded-lg ml-auto transition ${
                isStepValid(step)
                  ? "bg-white text-black border-gray-300 hover:bg-gray-50"
                  : "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
              }`}
              disabled={!isStepValid(step)}
            >
              Next
            </button>
          )}

          {step === steps.length && (
            <SubmitButton formData={formData} onSubmit={handleSubmit} />
          )}
        </div>

        {/* Save Draft */}
        <div className="text-center mt-6">
          <button
            onClick={saveAsDraft}
            className="px-12 py-2 bg-[#555252] text-white rounded-lg hover:bg-gray-500 transition"
          >
            Save as Draft
          </button>
        </div>
        </div>

        {/* Right column: image */}
        <div className="hidden ml-[-40px] md:flex items-start justify-end">
          <img
            src={profileImg}
            alt="Profile illustration"
            className="w-full w-[620px] h-[650px] shadow object-cover"
          />
        </div>
      </div>
      {/* Footer */}
      <ProfileFooter />
    </div>
  );
};

export default ProfileManagement;

// Footer
export const ProfileFooter = () => (
  <footer className="bg-gray-900 text-white py-12 mt-12">
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
);

// Dynamic Work Experience component
const DynamicWork = ({ formData, setFormData }) => {
  const initialFromForm = React.useMemo(() => {
    const list = Array.isArray(formData.workExperienceList)
      ? formData.workExperienceList
      : (formData.workExperience && (formData.workExperience.company || formData.workExperience.role || formData.workExperience.years))
        ? [formData.workExperience]
        : [];
    if (list.length === 0) return [{ company: "", role: "", years: "", hideDetails: false }];
    return list.map((it, idx) => ({ ...it, hideDetails: idx !== list.length - 1 ? true : false }));
  }, [formData.workExperienceList, formData.workExperience]);

  const [items, setItems] = React.useState(initialFromForm);

  // keep state in sync with parent: full list and last snapshot for compatibility
  React.useEffect(() => {
    const last = items[items.length - 1] || { company: "", role: "", years: "" };
    setFormData((d) => ({ ...d, workExperience: { ...last }, workExperienceList: items }));
  }, [items, setFormData]);

  const update = (idx, key, value) => {
    setItems((arr) => {
      const next = arr.slice();
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const addMore = (idx) => {
    setItems((arr) => {
      const next = arr.slice();
      // just collapse previous; DO NOT clear values
      next[idx] = { ...next[idx], hideDetails: true };
      next.push({ company: "", role: "", years: "", hideDetails: false });
      return next;
    });
  };

  const onCompanyFocus = (idx) => {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, hideDetails: false } : it)));
  };

  return (
    <div className="space-y-4">
      {items.map((it, idx) => (
        <div key={idx} className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Company"
              className="w-full p-3 border rounded-lg"
              value={it.company}
              onChange={(e) => update(idx, 'company', e.target.value)}
              onFocus={() => onCompanyFocus(idx)}
            />
            <button
              type="button"
              onClick={() => addMore(idx)}
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              title="Add more"
            >
              + More
            </button>
            {it.hideDetails && (
              <button
                type="button"
                onClick={() => update(idx, 'hideDetails', false)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                title="Edit"
              >
                Edit
              </button>
            )}
          </div>
          {!it.hideDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Role"
                className="w-full p-3 border rounded-lg"
                value={it.role}
                onChange={(e) => update(idx, 'role', e.target.value)}
              />
              <input
                type="text"
                placeholder="Years (e.g. 2019-2022)"
                className="w-full p-3 border rounded-lg"
                value={it.years}
                onChange={(e) => update(idx, 'years', e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Dynamic Skills and Certifications
const DynamicSkills = ({ formData, setFormData }) => {
  const [skills, setSkills] = React.useState(() => {
    if (formData.skills?.skillset) return formData.skills.skillset.split(',').map((s) => s.trim()).filter(Boolean);
    return [""];
  });
  const [certs, setCerts] = React.useState(() => {
    if (formData.skills?.certifications) return formData.skills.certifications.split(',').map((s) => s.trim()).filter(Boolean);
    return [""];
  });

  React.useEffect(() => {
    setFormData((d) => ({
      ...d,
      skills: {
        skillset: skills.filter(Boolean).join(", "),
        certifications: certs.filter(Boolean).join(", "),
      },
    }));
  }, [skills, certs, setFormData]);

  const addSkill = () => setSkills((arr) => [...arr, ""]);
  const addCert = () => setCerts((arr) => [...arr, ""]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-semibold">Skills</label>
          <button type="button" onClick={addSkill} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">+ More</button>
        </div>
        <div className="space-y-2">
          {skills.map((v, idx) => (
            <input
              key={idx}
              type="text"
              placeholder="e.g. React, Node.js"
              className="w-full p-3 border rounded-lg"
              value={v}
              onChange={(e) => setSkills((arr) => arr.map((x, i) => (i === idx ? e.target.value : x)))}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-semibold">Certifications</label>
          <button type="button" onClick={addCert} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">+ More</button>
        </div>
        <div className="space-y-2">
          {certs.map((v, idx) => (
            <input
              key={idx}
              type="text"
              placeholder="e.g. AWS CCP"
              className="w-full p-3 border rounded-lg"
              value={v}
              onChange={(e) => setCerts((arr) => arr.map((x, i) => (i === idx ? e.target.value : x)))}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Submit with loading + success tick + 90% completeness gate
const SubmitButton = ({ formData, onSubmit }) => {
  const [state, setState] = React.useState("idle"); // idle | loading | done

  const completeness = React.useMemo(() => {
    let filled = 0, total = 0;
    const count = (obj) => {
      Object.values(obj).forEach((v) => {
        total += 1;
        if (String(v || "").trim()) filled += 1;
      });
    };
    count(formData.personalInfo);
    count(formData.education);
    count(formData.workExperience);
    count(formData.skills);
    return total ? Math.round((filled / total) * 100) : 0;
  }, [formData]);

  const handleClick = async () => {
    if (completeness < 90) {
      window.appToast && window.appToast(`Please complete at least 90% of your profile (current: ${completeness}%).`, "warn");
      return;
    }
    setState("loading");
    await new Promise((r) => setTimeout(r, 900));
    setState("done");
    await new Promise((r) => setTimeout(r, 500));
    onSubmit();
  };

  return (
    <button
      onClick={handleClick}
      className={`px-6 py-3 rounded-lg ml-auto transition ${
        state === 'done' ? 'bg-green-600 text-white' : state === 'loading' ? 'bg-gray-400 text-white' : 'bg-green-600 text-white hover:bg-green-700'
      }`}
      disabled={state !== 'idle'}
    >
      {state === 'loading' ? 'Submitting…' : state === 'done' ? '✓ Submitted' : 'Submit'}
    </button>
  );
};
