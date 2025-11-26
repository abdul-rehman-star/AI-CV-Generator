// src/components/CVGenerator.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaUser, FaCopy, FaDownload, FaFileAlt, FaStar, FaMagic, FaBriefcase, FaGraduationCap, FaCertificate, FaTools } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CVGenerator = () => {
  const [profile, setProfile] = useState(null);
  const [customNotes, setCustomNotes] = useState("");
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userProfile"));
      setProfile(saved || null);
    } catch {
      setProfile(null);
    }
  }, []);

  const OPENAI_API_KEY = import.meta?.env?.VITE_OPENAI_API_KEY;

  // Remove leading/trailing Markdown code fences like ```html ... ```
  function cleanCvText(raw) {
    if (!raw) return "";
    let text = String(raw).trim();
    // Handle fenced blocks that start with ```html or ```
    text = text.replace(/^```(?:[a-zA-Z]+)?\r?\n?/, "");
    text = text.replace(/\r?\n?```\s*$/, "");
    return text.trim();
  }

  // Derive a plain text version of the generated CV (strip HTML tags)
  const cvPlainText = useMemo(() => {
    if (!cvText) return "";
    const container = document.createElement("div");
    container.innerHTML = cvText;
    const text = container.textContent || container.innerText || "";
    return text.replace(/\u00A0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }, [cvText]);

  const handleGenerate = async () => {
    setError("");
    if (!profile) {
      setError("Profile not found. Please fill your profile first.");
      return;
    }
    
    // Debug: Log profile data being sent
    console.log("=== Profile Data Being Sent to GPT ===");
    console.log("Profile:", JSON.stringify(profile, null, 2));
    console.log("Custom Notes:", customNotes);
    
    // Test API connectivity first
    try {
      const healthCheck = await fetch("/api/health");
      console.log("API Health Check:", healthCheck.status);
    } catch (healthError) {
      console.error("API Health Check Failed:", healthError);
      setError("Cannot connect to server. Please make sure the backend is running on port 5000.");
      return;
    }
    
    // Backend holds the secret; frontend key is optional now
    setLoading(true);
    try {
      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, customNotes }),
      });
      if (!res.ok) {
        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          throw new Error(`Server error (${res.status}): ${res.statusText}`);
        }
        
        if (data?.mock) {
          // This is a mock CV due to missing API key
          setCvText(cleanCvText(data.text));
          setError("⚠️ Using mock CV. To generate AI-powered CVs, please configure your OpenAI API key in the backend environment variables.");
        } else {
          throw new Error(data?.error || `Server error (${res.status}): ${res.statusText}`);
        }
      } else {
        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error("Failed to parse success response:", parseError);
          throw new Error("Invalid response format from server");
        }
        
        const text = data?.text || "";
        setCvText(cleanCvText(text));
        setError(""); // Clear any previous errors
      }
    } catch (e) {
      console.error("CV Generation Error:", e);
      console.error("Error details:", {
        message: e?.message,
        stack: e?.stack,
        name: e?.name
      });
      setError("Failed to generate CV. " + (e?.message || "Unknown error. Please check the console for details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate once when profile exists and cv not yet generated
    if (profile && !loading && !cvText) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cvPlainText);
      window.appToast && window.appToast("CV copied to clipboard (text)", "success");
    } catch (err) {
      window.appToast && window.appToast("Failed to copy CV: " + (err?.message || "Unknown error"), "error");
    }
  };

  const handleDownload = () => {
    // Create a complete HTML document with styling for download
    const css = getTemplateCss(selectedTemplate);
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${profile?.personalInfo?.name || "Professional"}</title>
    <style>${css}
    </style>
</head>
<body>
    ${cvText}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile?.personalInfo?.name || "cv"}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = async () => {
    if (!cvText) {
      window.appToast && window.appToast("No CV to download", "error");
      return;
    }

    try {
      window.appToast && window.appToast("Generating PDF...", "warn");
      
      // Create a temporary container for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.className = 'cv-preview';
      tempDiv.setAttribute('data-template', selectedTemplate);
      
      // Add CSS
      const style = document.createElement('style');
      style.textContent = getTemplateCss(selectedTemplate);
      tempDiv.appendChild(style);
      
      // Add CV content
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = cvText;
      tempDiv.appendChild(contentDiv);
      
      document.body.appendChild(tempDiv);
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      });
      
      // Remove temporary element
      document.body.removeChild(tempDiv);
      
      // Calculate PDF dimensions (A4)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate how many pages we need
      const totalPages = Math.ceil(imgHeight / pageHeight);
      
      // Add pages and images
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yPosition = -(i * pageHeight);
        pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
      }
      
      // Download PDF
      const fileName = `${profile?.personalInfo?.name || "CV"}_Resume.pdf`;
      pdf.save(fileName);
      
      window.appToast && window.appToast("PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      window.appToast && window.appToast("Failed to generate PDF: " + (error?.message || "Unknown error"), "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FaStar className="text-white text-xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">AI CV Generator</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Create a professional, ATS-friendly CV in seconds using advanced AI technology
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <FaMagic className="text-indigo-600" />
            <span className="text-sm text-indigo-600 font-medium">Powered by GPT-4</span>
          </div>
        </div>

        {!profile ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUser className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Profile Required</h3>
              <p className="text-gray-600 mb-6">
                Please complete your profile first to generate your professional CV.
              </p>
              <button className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Complete Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Panel - Profile & Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Snapshot Card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <FaUser className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Profile Snapshot</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FaUser className="text-gray-400 mt-1 text-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Personal Info</p>
                      <p className="text-sm text-gray-600">{profile?.personalInfo?.name || "Not provided"}</p>
                      <p className="text-xs text-gray-500">{profile?.personalInfo?.email || "No email"}</p>
                      <p className="text-xs text-gray-500">{profile?.personalInfo?.phone || "No phone"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FaGraduationCap className="text-blue-500 mt-1 text-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Education</p>
                      <p className="text-sm text-gray-600">{profile?.education?.degree || "Not provided"}</p>
                      <p className="text-xs text-gray-500">{profile?.education?.institution || "No institution"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FaBriefcase className="text-green-500 mt-1 text-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Experience</p>
                      <p className="text-sm text-gray-600">{profile?.workExperience?.role || "Not provided"}</p>
                      <p className="text-xs text-gray-500">{profile?.workExperience?.company || "No company"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FaTools className="text-purple-500 mt-1 text-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Skills</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{profile?.skills?.skillset || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FaCertificate className="text-orange-500 mt-1 text-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Certifications</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{profile?.skills?.certifications || "None listed"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Selector */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">CV Template</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['modern', 'classic', 'minimal'].map((template) => (
                    <button
                      key={template}
                      onClick={() => {
                        setSelectedTemplate(template);
                        // If not generated yet, auto-generate once
                        if (!cvText && !loading) {
                          handleGenerate();
                        } else {
                          window.appToast && window.appToast(`${template.charAt(0).toUpperCase() + template.slice(1)} style applied`, 'success');
                        }
                      }}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedTemplate === template
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {template.charAt(0).toUpperCase() + template.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <label className="block text-lg font-bold text-gray-900 mb-4">Additional Notes</label>
                <textarea
                  rows={4}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-gray-700"
                  placeholder="e.g., Focus on frontend roles, highlight React and Team leadership skills..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="w-full bg-black text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating CV...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FaStar />
                    Generate Professional CV
                  </div>
                )}
              </button>

              {/* Development Tools */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    const sampleProfile = {
                      personalInfo: {
                        name: "Ahmed Ali",
                        email: "ahmed.ali@example.com",
                        phone: "+92-300-1234567"
                      },
                      education: {
                        degree: "Bachelor of Computer Science",
                        institution: "University of Karachi",
                        year: "2022"
                      },
                      workExperience: {
                        company: "Tech Solutions Pakistan",
                        role: "Full Stack Developer",
                        years: "3",
                        description: "Developed web applications using React and Node.js"
                      },
                      skills: {
                        skillset: "JavaScript, React, Node.js, Python, MongoDB, AWS",
                        certifications: "AWS Certified Developer, Google Cloud Professional"
                      }
                    };
                    localStorage.setItem("userProfile", JSON.stringify(sampleProfile));
                    setProfile(sampleProfile);
                    window.appToast && window.appToast("Sample profile loaded! Now generate CV to see the difference.", "success");
                  }}
                  className="w-full text-sm py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Load Sample Profile (Testing)
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/health");
                      const status = response.status;
                      const text = await response.text();
                      let data;
                      try {
                        data = JSON.parse(text);
                      } catch {
                        data = text || null;
                      }
                      const message = typeof data === "object" && data !== null
                        ? `API Health Check: ${status}\nResponse: ${JSON.stringify(data)}`
                        : `API Health Check: ${status}\nResponse: ${data ?? "<empty body>"}`;
                      window.appToast && window.appToast(message, "warn");
                    } catch (error) {
                      window.appToast && window.appToast(`API Health Check Failed: ${error.message}`, "error");
                    }
                  }}
                  className="w-full text-sm py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Test API Connection
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - CV Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* CV Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <FaFileAlt className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Generated CV</h3>
                        <p className="text-sm text-gray-600">Professional • ATS-Friendly • {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Style</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCopy} 
                        disabled={!cvText}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaCopy className="text-sm" />
                        Copy
                      </button>
                      <button 
                        onClick={handleDownload} 
                        disabled={!cvText}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Download as styled HTML file"
                      >
                        <FaDownload className="text-sm" />
                        HTML
                      </button>
                      <button 
                        onClick={handlePrintPDF} 
                        disabled={!cvText}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Print or save as PDF"
                      >
                        <FaFileAlt className="text-sm" />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* CV Content */}
                <div className="p-4 sm:p-6 md:p-8">
                  {!cvText ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaFileAlt className="text-gray-400 text-xl" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h4>
                      <p className="text-gray-600 mb-6">Your professional CV will appear here after generation</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <FaStar className="text-indigo-500" />
                        <span>AI-powered • ATS-optimized • Professional formatting</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      key={selectedTemplate}
                      className="prose max-w-none cv-preview"
                      data-template={selectedTemplate}
                      style={{
                        lineHeight: '1.7',
                        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif'
                      }}
                    >
                      <style dangerouslySetInnerHTML={{ __html: getTemplateCss(selectedTemplate) }} />
                      <div dangerouslySetInnerHTML={{ __html: cvText }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVGenerator;

// Template-specific CSS injected for preview/download/print
function getTemplateCss(template) {
  const common = `
    .cv-preview * { box-sizing: border-box !important; }
    .cv-preview .cv-container { font-family: 'Segoe UI', Arial, sans-serif !important; line-height: 1.6 !important; color: #333 !important; margin: 0 auto !important; background: #fff !important; }
    .cv-preview .cv-sidebar { padding: 28px 22px !important; }
    .cv-preview .cv-main { padding: 30px 35px !important; }
    .cv-preview .cv-section { margin-bottom: 22px !important; }
    .cv-preview .cv-header { text-align: center !important; margin-bottom: 24px !important; padding-bottom: 16px !important; }
    .cv-preview .cv-sidebar p { font-size: 13px !important; line-height: 1.8 !important; margin: 6px 0 !important; }
    .cv-preview .cv-main p { font-size: 14px !important; line-height: 1.7 !important; margin: 0 !important; color: #444 !important; }
    .cv-preview h1, .cv-preview h2, .cv-preview h3 { margin: 0 !important; }
  `;

  if (template === 'classic') {
    return `
      ${common}
      .cv-preview { background:#ffffff !important; }
      .cv-preview .cv-container { 
        display: block !important; 
        border: 1px solid #ddd !important; 
        max-width: 800px !important;
      }
      .cv-preview .cv-sidebar { 
        display: none !important; 
        visibility: hidden !important;
        width: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .cv-preview .cv-main { 
        width: 100% !important; 
        max-width: 100% !important;
        padding: 40px 50px !important; 
      }
      .cv-preview .cv-header { 
        border-bottom: 2px solid #222222 !important; 
        margin-bottom: 30px !important;
        padding-bottom: 20px !important;
      }
      .cv-preview .cv-header h1 { 
        font-size: 28px !important; 
        font-weight: 700 !important; 
        text-transform: uppercase !important; 
        color: #222 !important;
        margin-bottom: 10px !important;
      }
      .cv-preview .cv-main h2 { 
        font-size: 20px !important; 
        font-weight: 700 !important; 
        color:#222 !important; 
        border-bottom: 2px solid #222 !important; 
        padding-bottom: 8px !important; 
        margin-top: 30px !important;
        margin-bottom: 15px !important;
      }
      .cv-preview .cv-section { 
        margin-bottom: 25px !important; 
      }
    `;
  }

  if (template === 'minimal') {
    return `
      ${common}
      .cv-preview { background:#ffffff !important; }
      .cv-preview .cv-container { 
        display: block !important;
        box-shadow: none !important; 
        border: none !important;
        max-width: 700px !important;
      }
      .cv-preview .cv-sidebar { 
        display: none !important; 
        visibility: hidden !important;
        width: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .cv-preview .cv-main { 
        width: 100% !important; 
        max-width: 100% !important;
        padding: 30px 40px !important; 
      }
      .cv-preview .cv-header { 
        border-bottom: 1px solid #e5e5e5 !important; 
        margin-bottom: 25px !important;
        padding-bottom: 15px !important;
      }
      .cv-preview .cv-header h1 { 
        font-size: 24px !important; 
        font-weight: 600 !important; 
        letter-spacing: 0.5px !important; 
        color: #111 !important;
        margin: 0 !important;
        text-transform: none !important;
      }
      .cv-preview .cv-main h2 { 
        font-size: 16px !important; 
        font-weight: 600 !important; 
        color:#333 !important; 
        border-bottom: 1px solid #e5e5e5 !important; 
        padding-bottom: 5px !important; 
        margin-top: 25px !important;
        margin-bottom: 12px !important;
        text-transform: none !important;
      }
      .cv-preview .cv-section { 
        margin-bottom: 20px !important; 
      }
      .cv-preview .cv-main p {
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #555 !important;
      }
    `;
  }

  // modern (default)
  return `
    ${common}
    .cv-preview { background: #f5f5f5 !important; }
    .cv-preview .cv-container { 
      display: flex !important;
      box-shadow: 0 0 20px rgba(0,0,0,0.08) !important; 
      border-radius: 10px !important; 
      overflow: hidden !important; 
      max-width: 900px !important;
    }
    .cv-preview .cv-sidebar { 
      width: 35% !important;
      background:#222222 !important; 
      color:#fff !important; 
      min-height: 100vh !important; 
    }
    .cv-preview .cv-main {
      width: 65% !important;
    }
    .cv-preview .cv-header { 
      border-bottom: 2px solid rgba(255,255,255,0.25) !important; 
    }
    .cv-preview .cv-header h1 { 
      margin:0 !important; 
      font-size:24px !important; 
      font-weight:700 !important; 
      text-transform:uppercase !important; 
      letter-spacing:1px !important; 
    }
    .cv-preview .cv-main h2 { 
      font-size:18px !important; 
      font-weight:700 !important; 
      color:#222222 !important; 
      margin:0 0 20px 0 !important; 
      text-transform:uppercase !important; 
      letter-spacing:.5px !important; 
      border-bottom:2px solid #667eea !important; 
      padding-bottom:8px !important; 
    }
  `;
}




