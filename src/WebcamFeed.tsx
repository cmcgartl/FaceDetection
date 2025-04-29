import React, { useRef, useState, useEffect } from 'react';
import { loadModels, loadLabeledImages, faceapi } from './FaceDetection';

// Main component that handles webcam video, facial detection, and real-time overlay
const WebcamFeed: React.FC = () => {
  // References for direct access to video and canvas DOM elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Application state variables
  const [isCameraOn, setIsCameraOn] = useState(false); // Whether webcam is active
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null); // For face recognition
  const [detections, setDetections] = useState<any[]>([]); // Detected faces
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 }); // Video resolution

  
  // Load models and labeled face data once on component mount
  useEffect(() => {
    const load = async () => {
      await loadModels();
      console.log('Face recognition models loaded');

      const labeledDescriptors = await loadLabeledImages();
      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      setFaceMatcher(matcher);

      console.log('Labeled faces loaded');
    };
    load();
  }, []);

  // Start webcam and begin face detection
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          setIsCameraOn(true);
          console.log("Camera stream started");

          // Save the natural video size to support correct overlay scaling
          setVideoSize({
            width: videoRef.current!.videoWidth,
            height: videoRef.current!.videoHeight
          });

          // Wait for video to be fully ready before starting detection
          const checkVideoReady = () => {
            if (videoRef.current?.readyState === 4) {
              console.log("Video ready, starting face detection");
              detectFaces();
            } else {
              requestAnimationFrame(checkVideoReady);
            }
          };
          checkVideoReady();
        };
      }
      streamRef.current = stream;
    } catch (err) {
      console.error('Error accessing webcam: ', err);
    }
  };

  // Stop webcam and reset detection overlays
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setDetections([]);
    
    // Clear drawn landmarks when camera stops
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Core detection loop: detect faces, draw landmarks, update overlays
  const detectFaces = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const detect = async () => {
      if (!video || video.paused || video.ended) {
        return;
      }

      try {
        // Detect faces with additional attributes (landmarks, expressions, etc.)
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();

        // Resize detection results to match display size
        const resizedDetections = faceapi.resizeResults(detections, {
          width: video.videoWidth,
          height: video.videoHeight
        });

        setDetections(resizedDetections);

        // Draw face landmarks and expressions on transparent canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }

      } catch (err) {
        console.error('Error during detection: ', err);
      }

      requestAnimationFrame(detect);
    };

    detect();
  };

  // Main Render Section
  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <div className="mb-3">
        {/* Start/Stop Camera Button */}
        {isCameraOn ? (
          <button className="btn btn-danger" onClick={stopCamera}>
            Stop Camera
          </button>
        ) : (
          <button className="btn btn-success" onClick={startCamera}>
            Start Camera
          </button>
        )}
      </div>

      {/* Video feed with overlays */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', maxWidth: '600px', borderRadius: '8px' }}
        />

        {/* Canvas for landmark drawing */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* Face bounding boxes and labels */}
        {detections.map((detection, index) => {
          const { x, y, width, height } = detection.detection.box;

          const videoElement = videoRef.current;
          if (!videoElement) return null;

          // Calculate scaling factors to map original detection coordinates to displayed video size
          const videoDisplayWidth = videoElement.offsetWidth;
          const videoDisplayHeight = videoElement.offsetHeight;
          const scaleX = videoDisplayWidth / videoSize.width;
          const scaleY = videoDisplayHeight / videoSize.height;

          // Slightly shrink boxes to better align visually with face features
          const boxShrinkFactor = 0.87; // Shrink bounding box by 13%
          const adjustedWidth = width * scaleX * boxShrinkFactor;
          const adjustedHeight = height * scaleY * boxShrinkFactor;
          const adjustedLeft = (x * scaleX) + (width * scaleX * (1 - boxShrinkFactor) / 2);
          const adjustedTop = (y * scaleY) + (height * scaleY * (1 - boxShrinkFactor) / 2);

          // Face recognition, gender, and age metadata
          const bestMatch = faceMatcher?.findBestMatch(detection.descriptor);
          const roundedAge = Math.round(detection.age);
          const gender = detection.gender;
          const genderProbability = detection.genderProbability;

          const label = bestMatch
            ? `${bestMatch.toString()} | ${gender} (${(genderProbability * 100).toFixed(0)}%) | Age: ${roundedAge}`
            : "Unknown";

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: adjustedTop,
                left: adjustedLeft,
                width: adjustedWidth,
                height: adjustedHeight,
                border: '2px solid lime',
                pointerEvents: 'none',
              }}
            >
              {/* Floating label above face box */}
              <div
                style={{
                    backgroundColor: 'rgba(0,255,0,0.2)',
                    color: 'black',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '2px 4px',
                    position: 'absolute',
                    top: '-30px',
                    left: '50%',        
                    transform: 'translateX(-50%)', 
                    borderRadius: '4px',
                    minWidth: '100px',      
                    maxWidth: '700px',      
                    whiteSpace: 'nowrap',   
                    overflow: 'hidden',     
                    textOverflow: 'ellipsis', 
                    textAlign: 'center',
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WebcamFeed;