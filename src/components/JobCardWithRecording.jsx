import React, { useState, useRef } from 'react';
import { startDOMRecording, downloadRecording } from '../utils/domRecorder';
import './JobCardWithRecording.css';

const JobCardWithRecording = ({ job }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingControls, setRecordingControls] = useState(null);
  const videoRef = useRef(null);

  const handleStartRecording = async () => {
    try {
      const controls = await startDOMRecording('job-card', {
        fps: 30,
        onDataAvailable: (data) => {
          console.log('Recording data:', data.size, 'bytes');
        },
        onStop: (blob) => {
          setRecordedBlob(blob);
          setIsRecording(false);
          setRecordingControls(null);
        },
        onError: (error) => {
          console.error('Recording error:', error);
          window.appToast && window.appToast('Recording failed: ' + error.message, 'error');
        }
      });

      setRecordingControls(controls);
      setIsRecording(true);

      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = controls.getStream();
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      window.appToast && window.appToast('Error starting recording: ' + error.message, 'error');
    }
  };

  const handleStopRecording = () => {
    if (recordingControls) {
      recordingControls.stop();
    }
  };

  const handleDownloadRecording = () => {
    if (recordedBlob) {
      downloadRecording(recordedBlob, `job-${job.id}-recording.webm`);
    }
  };

  return (
    <div className="job-card-container">
      {/* Job Card with Recording ID */}
      <div id="job-card" className={`job-card ${isRecording ? 'recording' : ''}`}>
        <div className="job-header">
          <h3>{job.title}</h3>
          <div className="job-meta">
            <span className="company">{job.company}</span>
            <span className="location">{job.location}</span>
            <span className="salary">{job.salary}</span>
          </div>
        </div>

        <div className="job-content">
          <p className="job-description">{job.description}</p>
          
          <div className="job-requirements">
            <h4>Requirements:</h4>
            <ul>
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="job-skills">
            <h4>Skills:</h4>
            <div className="skill-tags">
              {job.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>

          <div className="job-actions">
            <button className="apply-btn">Apply Now</button>
            <button className="save-btn">Save Job</button>
            <button className="share-btn">Share</button>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            <span>Recording...</span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="recording-controls">
        {!isRecording ? (
          <button 
            onClick={handleStartRecording}
            className="record-btn"
            title="Record this job card"
          >
            🎥 Record Card
          </button>
        ) : (
          <button 
            onClick={handleStopRecording}
            className="stop-btn"
            title="Stop recording"
          >
            ⏹️ Stop Recording
          </button>
        )}

        {recordedBlob && (
          <button 
            onClick={handleDownloadRecording}
            className="download-btn"
            title="Download recording"
          >
            💾 Download
          </button>
        )}
      </div>

      {/* Video Preview */}
      {isRecording && (
        <div className="video-preview">
          <h4>Live Preview:</h4>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="preview-video"
          />
        </div>
      )}
    </div>
  );
};

// Sample job data for demonstration
const sampleJob = {
  id: 1,
  title: "Senior Frontend Developer",
  company: "Tech Solutions Inc.",
  location: "Remote",
  salary: "$80,000 - $120,000",
  description: "We are looking for a passionate Senior Frontend Developer to join our team. You will be responsible for building user-facing features and ensuring the best user experience.",
  requirements: [
    "5+ years of experience in frontend development",
    "Strong knowledge of React, Vue, or Angular",
    "Experience with modern CSS frameworks",
    "Understanding of responsive design principles",
    "Experience with version control systems"
  ],
  skills: ["React", "JavaScript", "CSS3", "HTML5", "Git", "Webpack", "TypeScript"]
};

// Example usage component
export const JobCardExample = () => {
  return (
    <div className="job-card-example">
      <h2>Job Card with Recording Feature</h2>
      <p>Click "Record Card" to start recording this job card, then interact with it!</p>
      <JobCardWithRecording job={sampleJob} />
    </div>
  );
};

export default JobCardWithRecording;

