import React, { useRef, useState, useEffect } from 'react';
import { loadModels, loadLabeledImages, faceapi } from './FaceDetection';

const WebcamFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          setIsCameraOn(true);
          console.log("Camera stream started");

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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsCameraOn(false);
  };

  const detectFaces = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
  
    if (!video || !canvas) return;
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    let isDetecting = false;
  
    const detect = async () => {
      if (!video || video.paused || video.ended) {
        return;
      }
  
      if (!isDetecting) {
        isDetecting = true;
  
        try {
          const descriptorDetections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptors();
          const expressionDetections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();
  
            const resizedDescriptors = faceapi.resizeResults(descriptorDetections, displaySize);
            const resizedExpressions = faceapi.resizeResults(expressionDetections, displaySize);
  

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          let label = "";
          if (resizedExpressions.length === 0) {
            ctx.fillStyle = 'red';
            ctx.font = '24px Arial';
            ctx.fillText('No faces detected', 20, 40);
          } else {
            resizedDescriptors.forEach((Expression) => {
                //const { age, gender, genderProbability } = Expression;
                //const { x, y, width, height } = Expression.detection.box;
                const bestMatch = faceMatcher!.findBestMatch(Expression.descriptor);
                label += `Name: ${bestMatch.toString()}`;
              }
            );
            
            resizedExpressions.forEach((Expression) => {
              const { age, gender, genderProbability } = Expression;
              const { x, y, width, height } = Expression.detection.box;
              ctx.strokeStyle = '#00FF00';
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, width, height);
              const roundedAge = Math.round(age);
              label += ` | ${gender} (${(genderProbability * 100).toFixed(0)}%) Age: ${roundedAge}`;
  
              ctx.fillStyle = 'blue';
              ctx.font = '16px Arial';
             //ctx.fillText(label, x, y > 20 ? y - 10 : y + 20); // Show above or below box
             ctx.fillText(label, x, y);
            });
  
            // Draw face features
            faceapi.draw.drawFaceExpressions(canvas, resizedExpressions);
            faceapi.draw.drawFaceLandmarks(canvas, resizedExpressions);
          }
        } catch (err) {
          console.error('Error during detection: ', err);
        }
  
        isDetecting = false;
      }
  
      requestAnimationFrame(detect);
    };
  
    detect();
  };
  

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <div className="mb-3">
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
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', maxWidth: '600px', borderRadius: '8px' }}
        />
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
      </div>
    </div>
  );
};

export default WebcamFeed;
