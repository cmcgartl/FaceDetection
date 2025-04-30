import React, { useState, useEffect, useRef } from 'react';
import { loadModels, loadLabeledImages, faceapi } from '../FaceDetection';
import FaceOverlay from '../components/FaceOverlay';
import { Link } from 'react-router-dom';
import './UploadPage.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setDetections, resetDetections } from '../Slices/detectionSlice';

const UploadImage: React.FC = () => {
  const dispatch = useDispatch();

  //get detected faces from the redux store
  const detections = useSelector((state: RootState) => state.detection.detections);

  //states for image upload, faceapi facematcher, as well as original/display size of image
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  //refs for upload image and canvas to overlay face detection data/features
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //load the faceapi face detection models and load images with labels
  useEffect(() => {
    const load = async () => {
      await loadModels();
      const labeledDescriptors = await loadLabeledImages();
      setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
      console.log('Models and labeled faces loaded.');
    };
    load();
  }, []);

  //load in user's selected image from files
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    dispatch(resetDetections());

    const img = new Image();
    img.src = imageUrl;

    //when image is loaded
    img.onload = async () => {
        //set the image's original size for scaling the overlay
      setOriginalSize({ width: img.width, height: img.height });
      //run faceapi facial detection functions on the image
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()
        .withFaceDescriptors();

    //resize the face detections to the image width and height
      const resizedDetections = faceapi.resizeResults(detections, {
        width: img.width,
        height: img.height,
      });

      //store the face detections in redux
      dispatch(setDetections(resizedDetections));
    };
  };

  useEffect(() => {
    //if the uploaded image and canvas are ready/valid
    if (
      uploadedImage &&
      imageRef.current &&
      canvasRef.current &&
      displaySize.width > 0 &&
      displaySize.height > 0
    ) {
        //set canvas size to image size
      canvasRef.current.width = displaySize.width;
      canvasRef.current.height = displaySize.height;

      //resize the face detections to match the display size of the image
      const resized = detections.map(det =>
        faceapi.resizeResults(det, {
          width: displaySize.width,
          height: displaySize.height,
        })
      );

      //clear old drawings, then draw face landmarks and emotion prediction
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resized);
      }
    }
  }, [uploadedImage, detections, displaySize]);


  return (
    <>
    {/*title header*/}
      <header className="upload-banner">
        <Link to="/" className="btn btn-light back-link">← Back To Home</Link>
        <div className="banner-title">
          <h1>Facial Recognition Web App</h1>
          <h5>Created by Connor McGartland</h5>
        </div>
      </header>

      <div className="upload-page">
        <h1>Upload An Image To Try Facial Recognition!</h1>

        {/*file select value*/}
        <div className="upload-select">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="form-control"
          />
        </div>

         {/*placehodler prompting user to upload their image*/}
        {!uploadedImage && (
          <div className="upload-box">
            <p>Upload A Photo!</p>
          </div>
        )}

        {/*User's uploaded image*/}
        {uploadedImage && (
          <div className="image-container">
            <img
              ref={imageRef}
              src={uploadedImage}
              alt="Uploaded"
              className="uploaded-image"
              onLoad={() => {
                if (imageRef.current) {
                  const { width, height } = imageRef.current.getBoundingClientRect();
                  if (width && height) {
                    setDisplaySize({ width, height });
                  }
                }
              }}
            />
             {/*canvas for face landmark and emotion prediction overlay*/}
            <canvas
              ref={canvasRef}
              className="overlay-canvas"
            />

            {detections.map((detection: any, index: number) => {
                //set size values to detection size
              const { x, y, width, height } = detection.detection.box;

              //calculate the ration between original image size and display size
              const scaleX = displaySize.width / originalSize.width;
              const scaleY = displaySize.height / originalSize.height;

              //set facial recognition data to the data found by faceapi
              const bestMatch = faceMatcher?.findBestMatch(detection.descriptor);
              const roundedAge = Math.round(detection.age);
              const gender = detection.gender;
              const genderProbability = detection.genderProbability;

              //set label to display facial recognition data
              const label = bestMatch
                ? `${bestMatch.toString()} | ${gender} (${(genderProbability * 100).toFixed(0)}%) | Age: ${roundedAge}`
                : 'Unknown';

            //display the overlay over the face 
              return (
                <FaceOverlay
                  key={index}
                  box={{ x, y, width, height }}
                  label={label}
                  shrinkFactor={0.95}
                  scale={{ x: scaleX, y: scaleY }}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default UploadImage;
