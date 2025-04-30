import React, { useRef, useState, useEffect } from 'react';
import { loadModels, loadLabeledImages, faceapi } from '../FaceDetection';
import FaceOverlay from '../components/FaceOverlay';
import { Link } from 'react-router-dom';
import './WebcamPage.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setDetections, resetDetections, setCameraOn } from '../Slices/detectionSlice';

const WebcamPage: React.FC = () => {
  // Refs to DOM elements for webcam and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dispatch = useDispatch();

  // Select face detections and camera state from Redux store
  const detections = useSelector((state: RootState) => state.detection.detections);
  const isCameraOn = useSelector((state: RootState) => state.detection.isCameraOn);

  // Local state for the face matcher and video resolution
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  // Load face-api.js models and assign/get labels or presaved images
  useEffect(() => {
    const load = async () => {
      await loadModels(); // Load detection and recognition models
      const labeledDescriptors = await loadLabeledImages(); // Load known faces
      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // Create face matcher with threshold
      setFaceMatcher(matcher);
      console.log('Models and labeled faces loaded.');
    };
    load();
  }, []);

  // Starts webcam video and starts detection when ready
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // Access webcam
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // play the video and initialize face detection when metadata gets loaded
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          dispatch(setCameraOn(true)); // Update Redux state that camera is on

          // Save actual video resolution for scaling overlays
          setVideoSize({
            width: videoRef.current!.videoWidth,
            height: videoRef.current!.videoHeight,
          });

          // Wait for video to be fully ready before detecting faces
          const checkVideoReady = () => {
            if (videoRef.current?.readyState === 4) {
              detectFaces(); 
            } else {
              requestAnimationFrame(checkVideoReady); // Try again on next frame
            }
          };
          checkVideoReady();
        };
      }
    } catch (err) {
      console.error('Error starting camera: ', err);
    }
  };

  // Stops webcam stream and resets detections/overlays
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop()); // Stop all video tracks
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Disconnect stream from video element
    }

    dispatch(setCameraOn(false)); // Update Redux that  camera is off
    dispatch(resetDetections()); // Clear detections from store

    // Clear the canvas overlay
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Detect faces while the webcam is recording
  const detectFaces = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const detect = async () => {
      if (!video || video.paused || video.ended) return;

      
      try {
        // use faceapi to detect/analyze faces in the webcam video
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();

        // Resize results to match webcam video resolution
        const resizedDetections = faceapi.resizeResults(detections, {
          width: video.videoWidth,
          height: video.videoHeight,
        });

        dispatch(setDetections(resizedDetections)); 

        // Resize canvas to webcam video resolutioj and draw overlays
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); // Draw face landmarks (eyes, nose, mouth, etc)
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections); // displays emotion predictions
        }
      } catch (err) {
        console.error('Error during detection: ', err);
      }

      //continues the detection loop on the next frame
      requestAnimationFrame(detect);
    };


    detect();
  };

  return (
    <>
      {/* Header with title and navigation */}
      <header className="webcam-banner">
        <Link to="/" className="btn btn-light back-link">← Back To Home</Link>
        <div className="banner-title">
          <h1>Facial Recognition Web App</h1>
          <h5>Created by Connor McGartland</h5>
        </div>
      </header>

      {/* Main page layout */}
      <div className="webcam-page">
        <h1>Live Webcam Facial Recognition!</h1>

        {/* Toggle webcam controls */}
        <div className="camera-controls">
           {isCameraOn ? (
            <button className="btn btn-danger" onClick={stopCamera}>Stop Camera</button>
          ) : (
            <button className="btn btn-success" onClick={startCamera}>Start Camera</button>
          )}
        </div>

        {/* Video container with detection overlay */}
        <div className="video-box">
          <p>Start your camera to try out facial recognition!</p>
          <video ref={videoRef} autoPlay playsInline muted className="video-element" />
          <canvas ref={canvasRef} className="overlay-canvas" />

          {/* Render FaceOverlay for each detected face */}
          {detections.map((detection: any, index: number) => {
            const { x, y, width, height } = detection.detection.box;
            const videoEl = videoRef.current;
            if (!videoEl || !videoSize.width) return null;

            // Calculate scaling from native resolution to displayed video size
            const scaleX = videoEl.offsetWidth / videoSize.width;
            const scaleY = videoEl.offsetHeight / videoSize.height;

            // get the information from facial recognition
            const bestMatch = faceMatcher?.findBestMatch(detection.descriptor);
            const roundedAge = Math.round(detection.age);
            const gender = detection.gender;
            const genderProbability = detection.genderProbability;

            // set label text with data from facial recognition
            const label = bestMatch
              ? `${bestMatch.toString()} | ${gender} (${(genderProbability * 100).toFixed(0)}%) | Age: ${roundedAge}`
              : "Unknown";

            // Render overlay for the face
            return (
              <FaceOverlay
                key={index}
                box={{ x, y, width, height }}
                label={label}

                //apply a shrink factor because face boxes were appearing too large
                shrinkFactor={0.87}
                scale={{ x: scaleX, y: scaleY }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default WebcamPage;
