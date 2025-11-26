import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './DOMRecorder.css';

const DOMRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState('dom'); // 'dom' or 'screen'
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

  // DOM Recording Function
  const startDOMRecording = async () => {
    try {
      const targetElement = document.getElementById('recordable-area');
      if (!targetElement) {
        window.appToast && window.appToast('Recordable area not found! Please make sure there is an element with id="recordable-area"', 'warn');
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
            height: targetElement.offsetHeight
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

  // Screen Recording Function
  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      });

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
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting screen recording:', error);
      window.appToast && window.appToast('Error starting screen recording: ' + error.message, 'error');
    }
  };

  const startRecording = () => {
    if (recordingType === 'dom') {
      startDOMRecording();
    } else {
      startScreenRecording();
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
    <div className="dom-recorder">
      <h2>🎥 DOM & Screen Recorder</h2>
      
      {/* Recording Controls */}
      <div className="recorder-controls">
        <div className="recording-type">
          <label>
            <input
              type="radio"
              value="dom"
              checked={recordingType === 'dom'}
              onChange={(e) => setRecordingType(e.target.value)}
            />
            DOM Recording
          </label>
          <label>
            <input
              type="radio"
              value="screen"
              checked={recordingType === 'screen'}
              onChange={(e) => setRecordingType(e.target.value)}
            />
            Screen Recording
          </label>
        </div>

        <div className="control-buttons">
          {!isRecording ? (
            <button onClick={startRecording} className="start-btn">
              ▶️ Start Recording
            </button>
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
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', maxWidth: '600px', border: '2px solid #ccc' }}
        />
      </div>

      {/* Recordable Area for DOM Recording */}
      <div id="recordable-area" className="recordable-area">
        <h3>📝 This is the Recordable Area</h3>
        <p>This content will be recorded when you select "DOM Recording"</p>
        <div className="sample-content">
          <div className="card">
            <h4>Sample Card 1</h4>
            <p>This is some sample content that will be recorded.</p>
            <button>Click Me!</button>
          </div>
          <div className="card">
            <h4>Sample Card 2</h4>
            <p>More sample content for demonstration.</p>
            <input type="text" placeholder="Type something..." />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>📋 How to Use:</h3>
        <ul>
          <li><strong>DOM Recording:</strong> Records the content inside the "Recordable Area" above</li>
          <li><strong>Screen Recording:</strong> Records your entire screen or a specific window/tab</li>
          <li>Click "Start Recording" to begin</li>
          <li>Click "Stop Recording" when done</li>
          <li>Download your recording as a .webm file</li>
        </ul>
      </div>
    </div>
  );
};

export default DOMRecorder;
