# 🎥 DOM Recording Feature

यह feature आपको किसी भी DOM element को record करने की सुविधा देता है। यह `html2canvas` और `MediaRecorder` APIs का use करता है।

## 🚀 Features

- **DOM Element Recording**: किसी भी specific DOM element को record करें
- **Screen Recording**: पूरे screen या specific window को record करें
- **Real-time Preview**: Recording के दौरान live preview देखें
- **Download Support**: Recorded video को .webm format में download करें
- **Easy Integration**: किसी भी component में easily integrate करें

## 📁 Files Structure

```
src/
├── components/
│   ├── DOMRecorder.jsx          # Main recording component
│   ├── DOMRecorder.css          # Styles for main component
│   ├── RecordingDemo.jsx        # Interactive demo component
│   ├── RecordingDemo.css        # Demo styles
│   ├── JobCardWithRecording.jsx # Example with job card
│   └── JobCardWithRecording.css # Job card styles
├── utils/
│   └── domRecorder.js           # Utility functions
└── App.jsx                      # Routes configuration
```

## 🛠️ Installation

```bash
npm install html2canvas
```

## 📖 Usage

### 1. Basic DOM Recording

```jsx
import { startDOMRecording, downloadRecording } from '../utils/domRecorder';

const MyComponent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const handleStartRecording = async () => {
    const controls = await startDOMRecording('my-element-id', {
      fps: 30,
      onStop: (blob) => {
        setRecordedBlob(blob);
        setIsRecording(false);
      }
    });
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (controls) controls.stop();
  };

  const handleDownload = () => {
    if (recordedBlob) {
      downloadRecording(recordedBlob, 'my-recording.webm');
    }
  };

  return (
    <div>
      <div id="my-element-id">
        {/* Your content to record */}
      </div>
      
      <button onClick={handleStartRecording}>Start Recording</button>
      <button onClick={handleStopRecording}>Stop Recording</button>
      <button onClick={handleDownload}>Download</button>
    </div>
  );
};
```

### 2. Screen Recording

```jsx
import { startScreenRecording } from '../utils/domRecorder';

const handleScreenRecording = async () => {
  const controls = await startScreenRecording({
    audio: true,
    video: { mediaSource: 'screen' },
    onStop: (blob) => {
      downloadRecording(blob, 'screen-recording.webm');
    }
  });
};
```

### 3. Using the Complete Component

```jsx
import DOMRecorder from './components/DOMRecorder';

const App = () => {
  return (
    <div>
      <DOMRecorder />
    </div>
  );
};
```

## 🎯 Available Routes

- `/recorder` - Main DOM recording component
- `/demo` - Interactive demo with multiple cards
- `/job-example` - Job card with recording feature

## ⚙️ Configuration Options

### DOM Recording Options

```javascript
const options = {
  fps: 30,                    // Frames per second
  mimeType: 'video/webm;codecs=vp9', // Video format
  quality: 0.8,               // Recording quality
  onDataAvailable: (data) => {}, // Data available callback
  onStop: (blob) => {},       // Recording stopped callback
  onError: (error) => {}      // Error callback
};
```

### Screen Recording Options

```javascript
const options = {
  audio: true,                // Include audio
  video: { mediaSource: 'screen' }, // Video source
  mimeType: 'video/webm;codecs=vp9', // Video format
  onDataAvailable: (data) => {}, // Data available callback
  onStop: (blob) => {},       // Recording stopped callback
  onError: (error) => {}      // Error callback
};
```

## 🔧 Utility Functions

### `startDOMRecording(elementId, options)`
किसी specific DOM element को record करने के लिए।

### `startScreenRecording(options)`
Screen recording के लिए।

### `downloadRecording(blob, filename)`
Recorded video को download करने के लिए।

### `createVideoPreview(stream, options)`
Video preview element बनाने के लिए।

### `checkBrowserSupport()`
Browser support check करने के लिए।

### `getSupportedMimeTypes()`
Supported video formats check करने के लिए।

## 🌐 Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ⚠️ Limited support (some features may not work)
- **Edge**: ✅ Full support

## 📱 Mobile Support

- **Android Chrome**: ✅ Full support
- **iOS Safari**: ⚠️ Limited support

## 🚨 Important Notes

1. **HTTPS Required**: Screen recording के लिए HTTPS connection जरूरी है
2. **User Permission**: Screen recording के लिए user permission चाहिए
3. **File Size**: Long recordings का file size बड़ा हो सकता है
4. **Performance**: High FPS recording से performance impact हो सकता है

## 🐛 Troubleshooting

### Common Issues

1. **"Element not found" Error**
   - Check कि element का ID correct है
   - Ensure element DOM में exist करता है

2. **"Recording failed" Error**
   - Check browser support
   - Ensure HTTPS connection
   - Check user permissions

3. **Poor Quality Recording**
   - Increase FPS setting
   - Check element size
   - Ensure good contrast

4. **Large File Size**
   - Reduce FPS
   - Limit recording duration
   - Use compression

## 🎨 Customization

### CSS Classes

```css
.recording {
  border: 2px solid #f44336;
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.3);
}

.recording-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f44336;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}
```

### Custom Styling

```jsx
const customStyles = {
  recording: {
    border: '3px solid #4caf50',
    boxShadow: '0 0 30px rgba(76, 175, 80, 0.5)'
  }
};
```

## 📚 Examples

### Example 1: Simple Card Recording

```jsx
const SimpleCard = () => {
  const [recording, setRecording] = useState(false);
  
  return (
    <div id="simple-card" className={recording ? 'recording' : ''}>
      <h3>My Card</h3>
      <p>This content will be recorded</p>
      <button onClick={() => setRecording(!recording)}>
        {recording ? 'Stop' : 'Record'}
      </button>
    </div>
  );
};
```

### Example 2: Form Recording

```jsx
const FormWithRecording = () => {
  const handleRecord = async () => {
    const controls = await startDOMRecording('form-container', {
      onStop: (blob) => {
        // Save form interaction recording
        saveRecording(blob);
      }
    });
  };

  return (
    <div id="form-container">
      <form>
        <input type="text" placeholder="Name" />
        <input type="email" placeholder="Email" />
        <button type="submit">Submit</button>
      </form>
      <button onClick={handleRecord}>Record Form</button>
    </div>
  );
};
```

## 🤝 Contributing

अगर आप कोई improvement या bug fix करना चाहते हैं:

1. Fork करें repository को
2. Create करें feature branch
3. Commit करें changes
4. Push करें branch को
5. Create करें Pull Request

## 📄 License

MIT License - Free to use for personal and commercial projects.

---

**Happy Recording! 🎬✨**

