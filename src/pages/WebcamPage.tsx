import React, { useRef, useState, useEffect } from 'react';
import { loadModels, loadLabeledImages, faceapi } from '../FaceDetection';
import { Link } from 'react-router-dom';
import './WebcamPage.css';
import FaceOverlay from '../components/FaceOverlay';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setDetections, resetDetections, setCameraOn } from '../Slices/detectionSlice';

//component to open user's webcam feed and perform/display facial recognition data
const WebcamPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionActive = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [renderOverlays, setRenderOverlays] = useState(false);
  const dispatch = useDispatch();

  const detections = useSelector((state: RootState) => state.detection.detections);
  const isCameraOn = useSelector((state: RootState) => state.detection.isCameraOn);

  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);

  //load the faceapi.js facial recognition models and label images
  useEffect(() => {
    const load = async () => {
      await loadModels();
      const labeledDescriptors = await loadLabeledImages();
      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      setFaceMatcher(matcher);
      console.log('Models and labeled faces loaded.');
    };
    load();
  }, []);

  //start webcam video
  const startCamera = async () => {

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        detectionActive.current = true; //sets detection to true, allows overlays to start
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          dispatch(setCameraOn(true)); //update camera state
          setRenderOverlays(true); //enable overlays

          //when the webcam is ready, begin detecting faces
          const checkVideoReady = () => {
            if (videoRef.current?.readyState === 4) {
              detectFaces();
            } else {
              requestAnimationFrame(checkVideoReady);
            }
          };
          checkVideoReady();
        };
      }
    } catch (err) {
      console.error('Error starting camera: ', err);
    }
  };

  //stop the webcam video feed
  const stopCamera = () => {
    //set detection as off and disable overlays
    setRenderOverlays(false); 
    detectionActive.current = false;

    //ensures the next animation frame doesn't cause overlays to stay after camera is stopped
    if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

     // Clear canvases 
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

    // Clear Redux face data first
    dispatch(resetDetections());
  
    // Stop the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  
    //update camera state to off
    dispatch(setCameraOn(false));
  };
  

  const detectFaces = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const detect = async () => {
        //ensure video is valid and playing
      if (!video || video.paused || video.ended) return;

      try {
        //perform faceapi face detection on the video feed
        const rawDetections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();

        //match canvays size to the video dimensions
        const displayWidth = video.offsetWidth;
        const displayHeight = video.offsetHeight;
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        //resize face detections to the video display size
        const resizedDetections = faceapi.resizeResults(rawDetections, {
          width: displayWidth,
          height: displayHeight,
        });

        //draw face landmards and emotion prediction on the canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }

        //if detection is active, push the detections to redux store
        if (!detectionActive.current) return;
        dispatch(setDetections(resizedDetections));
      } catch (err) {
        console.error('Error during detection:', err);
      }

      //if detection is active, continue
      if (detectionActive.current) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  return (
    <>
    {/*header containing title and back to home button*/}
      <header className="webcam-banner">
        <Link to="/" className="btn btn-light back-link">← Back To Home</Link>
        <div className="banner-title">
          <h1>Facial Recognition Web App</h1>
          <h5>Created by Connor McGartland</h5>
        </div>
      </header>

      <div className="webcam-page">
        <h1>Live Webcam Facial Recognition!</h1>

        {/*Camera start and stop button*/}
        <div className="camera-controls">
          {isCameraOn ? (
            <button className="btn btn-danger" onClick={stopCamera}>Stop Camera</button>
          ) : (
            <button className="btn btn-success" onClick={startCamera}>Start Camera</button>
          )}
        </div>

        {/*PlaceHolder for when video is off*/}
        <div className="video-box">
          <p>Start your camera to try out facial recognition!</p>
          <video ref={videoRef} autoPlay playsInline muted className="video-element" />
          <canvas ref={canvasRef} className="overlay-canvas" />

          {/* FaceOverlay labels for each detected face */}
          {isCameraOn && detections.map((detection: any, index: number) => {
            const { x, y, width, height } = detection.detection.box;
            const videoEl = videoRef.current;
            if (!videoEl || !canvasRef.current) return null;

            {/*determine scaling needed to match overlay to video display size*/}
            const scaleX = videoEl.offsetWidth / canvasRef.current.width;
            const scaleY = videoEl.offsetHeight / canvasRef.current.height;

            //set face detection data
            const bestMatch = faceMatcher?.findBestMatch(detection.descriptor);
            const age = Math.round(detection.age);
            const gender = detection.gender;
            const confidence = (detection.genderProbability * 100).toFixed(0);

            //set label to match face detection data
            const label = bestMatch
              ? `${bestMatch.toString()} | ${gender} (${confidence}%) | Age: ${age}`
              : `Unknown | ${gender} (${confidence}%) | Age: ${age}`;

              //display the face bounding box and age/gender/name data
            return (
              <FaceOverlay
                key={index}
                box={{ x, y, width, height }}
                label={label}

                //shrink factor ensures the bounding box is properly sized
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
