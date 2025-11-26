import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './RecordingDemo.css';

const RecordingDemo = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  // DOM Recording Function for any element
  const startDOMRecording = async (elementId) => {
    try {
      const targetElement = document.getElementById(elementId);
      if (!targetElement) {
        window.appToast && window.appToast(`Element with id "${elementId}" not found!`, 'warn');
        return;
      }

      // Create canvas for recording
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = targetElement.offsetWidth;
      canvas.height = targetElement.offsetHeight;

      // Function to capture DOM as image and draw on canvas
      const captureFrame = async () => {
        try {
          const canvasElement = await html2canvas(targetElement, {
            allowTaint: true,
            useCORS: true,
            scale: 1,
            width: targetElement.offsetWidth,
            height: targetElement.offsetHeight,
            backgroundColor: null
          });
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(canvasElement, 0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error('Error capturing frame:', error);
        }
      };

      // Start capturing frames
      const startCapture = () => {
        captureFrame();
        animationFrameRef.current = requestAnimationFrame(startCapture);
      };
      startCapture();

      // Create stream from canvas
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        
        // Clean up
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting DOM recording:', error);
      window.appToast && window.appToast('Error starting recording: ' + error.message, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="recording-demo">
      <h2>🎬 Interactive DOM Recording Demo</h2>
      
      {/* Recording Controls */}
      <div className="demo-controls">
        <div className="control-buttons">
          {!isRecording ? (
            <>
              <button 
                onClick={() => startDOMRecording('demo-card-1')} 
                className="record-btn"
              >
                📹 Record Card 1
              </button>
              <button 
                onClick={() => startDOMRecording('demo-card-2')} 
                className="record-btn"
              >
                📹 Record Card 2
              </button>
              <button 
                onClick={() => startDOMRecording('demo-interactive')} 
                className="record-btn"
              >
                📹 Record Interactive Area
              </button>
            </>
          ) : (
            <button onClick={stopRecording} className="stop-btn">
              ⏹️ Stop Recording
            </button>
          )}
          
          {recordedBlob && (
            <button onClick={downloadRecording} className="download-btn">
              💾 Download Recording
            </button>
          )}
        </div>
      </div>

      {/* Video Preview */}
      <div className="video-preview">
        <h3>Live Preview:</h3>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', maxWidth: '600px', border: '2px solid #ccc', borderRadius: '8px' }}
        />
      </div>

      {/* Demo Cards */}
      <div className="demo-cards">
        <div id="demo-card-1" className="demo-card card-1">
          <h3>🎯 Card 1 - Static Content</h3>
          <p>This card contains static content that can be recorded.</p>
          <div className="card-content">
            <div className="info-box">
              <h4>Job Information</h4>
              <p>Position: Frontend Developer</p>
              <p>Company: Tech Corp</p>
              <p>Location: Remote</p>
            </div>
          </div>
        </div>

        <div id="demo-card-2" className="demo-card card-2">
          <h3>🎨 Card 2 - Dynamic Content</h3>
          <p>This card has interactive elements and animations.</p>
          <div className="card-content">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-number">85%</span>
                <span className="stat-label">Match</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.8</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>
        </div>

        <div id="demo-interactive" className="demo-card interactive-card">
          <h3>🎮 Interactive Area</h3>
          <p>Try interacting with these elements while recording!</p>
          <div className="interactive-content">
            <div className="form-group">
              <label>Name:</label>
              <input type="text" placeholder="Enter your name" />
            </div>
            <div className="form-group">
              <label>Skills:</label>
              <select>
                <option>React</option>
                <option>Vue</option>
                <option>Angular</option>
              </select>
            </div>
            <div className="button-group">
              <button className="action-btn">Save</button>
              <button className="action-btn secondary">Cancel</button>
            </div>
            <div className="toggle-section">
              <label className="toggle">
                <input type="checkbox" />
                <span className="slider"></span>
                Enable notifications
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>📋 How to Use This Demo:</h3>
        <ol>
          <li>Click on any "Record" button to start recording that specific card</li>
          <li>Interact with the elements while recording (type, click, hover)</li>
          <li>Click "Stop Recording" when done</li>
          <li>Download your recording as a .webm file</li>
          <li>Each card demonstrates different types of content that can be recorded</li>
        </ol>
      </div>
    </div>
  );
};

export default RecordingDemo;

