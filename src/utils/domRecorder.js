import html2canvas from 'html2canvas';

/**
 * DOM Recording Utility Functions
 * ये functions किसी भी component में use कर सकते हैं
 */

/**
 * Start recording a specific DOM element
 * @param {string} elementId - ID of the element to record
 * @param {Object} options - Recording options
 * @returns {Promise<Object>} - Recording controls object
 */
export const startDOMRecording = async (elementId, options = {}) => {
  const {
    fps = 30,
    mimeType = 'video/webm;codecs=vp9',
    quality = 0.8,
    onDataAvailable = null,
    onStop = null,
    onError = null
  } = options;

  try {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) {
      throw new Error(`Element with id "${elementId}" not found!`);
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
          backgroundColor: null,
          useCORS: true,
          logging: false
        });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvasElement, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error('Error capturing frame:', error);
        if (onError) onError(error);
      }
    };

    // Start capturing frames
    let animationFrameId;
    const startCapture = () => {
      captureFrame();
      animationFrameId = requestAnimationFrame(startCapture);
    };
    startCapture();

    // Create stream from canvas
    const stream = canvas.captureStream(fps);
    
    // Set up MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType
    });

    const recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        if (onDataAvailable) onDataAvailable(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      if (onStop) onStop(blob);
      
      // Clean up
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    mediaRecorder.onerror = (error) => {
      console.error('MediaRecorder error:', error);
      if (onError) onError(error);
    };

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms

    // Return controls object
    return {
      stop: () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      },
      pause: () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.pause();
        }
      },
      resume: () => {
        if (mediaRecorder && mediaRecorder.state === 'paused') {
          mediaRecorder.resume();
        }
      },
      getState: () => mediaRecorder.state,
      getStream: () => stream
    };

  } catch (error) {
    console.error('Error starting DOM recording:', error);
    if (onError) onError(error);
    throw error;
  }
};

/**
 * Start screen recording (full screen or specific window)
 * @param {Object} options - Recording options
 * @returns {Promise<Object>} - Recording controls object
 */
export const startScreenRecording = async (options = {}) => {
  const {
    audio = true,
    video = { mediaSource: 'screen' },
    mimeType = 'video/webm;codecs=vp9',
    onDataAvailable = null,
    onStop = null,
    onError = null
  } = options;

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: video,
      audio: audio
    });

    // Set up MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType
    });

    const recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        if (onDataAvailable) onDataAvailable(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      if (onStop) onStop(blob);
    };

    mediaRecorder.onerror = (error) => {
      console.error('MediaRecorder error:', error);
      if (onError) onError(error);
    };

    // Start recording
    mediaRecorder.start(100);

    // Return controls object
    return {
      stop: () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      },
      pause: () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.pause();
        }
      },
      resume: () => {
        if (mediaRecorder && mediaRecorder.state === 'paused') {
          mediaRecorder.resume();
        }
      },
      getState: () => mediaRecorder.state,
      getStream: () => stream
    };

  } catch (error) {
    console.error('Error starting screen recording:', error);
    if (onError) onError(error);
    throw error;
  }
};

/**
 * Download recorded blob as file
 * @param {Blob} blob - Recorded video blob
 * @param {string} filename - Name of the file to download
 */
export const downloadRecording = (blob, filename = `recording-${Date.now()}.webm`) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Create a video preview element from stream
 * @param {MediaStream} stream - Media stream
 * @param {Object} options - Video element options
 * @returns {HTMLVideoElement} - Video element
 */
export const createVideoPreview = (stream, options = {}) => {
  const {
    width = '100%',
    height = 'auto',
    autoplay = true,
    muted = true,
    playsInline = true,
    className = ''
  } = options;

  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = autoplay;
  video.muted = muted;
  video.playsInline = playsInline;
  video.style.width = width;
  video.style.height = height;
  video.className = className;

  return video;
};

/**
 * Check if browser supports required APIs
 * @returns {Object} - Support status object
 */
export const checkBrowserSupport = () => {
  const support = {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    getDisplayMedia: navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function',
    html2canvas: typeof html2canvas !== 'undefined',
    canvasCaptureStream: HTMLCanvasElement.prototype.captureStream !== undefined
  };

  support.allSupported = Object.values(support).every(Boolean);

  return support;
};

/**
 * Get available MIME types for MediaRecorder
 * @returns {Array<string>} - Array of supported MIME types
 */
export const getSupportedMimeTypes = () => {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/ogg;codecs=theora',
    'video/ogg'
  ];

  return types.filter(type => MediaRecorder.isTypeSupported(type));
};

// Default export with all functions
export default {
  startDOMRecording,
  startScreenRecording,
  downloadRecording,
  createVideoPreview,
  checkBrowserSupport,
  getSupportedMimeTypes
};

