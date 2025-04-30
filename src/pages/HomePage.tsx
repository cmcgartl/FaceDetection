import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
    return (
      <>
        {/* Top banner */}
        <header className="homepage-banner">
          <h1>Facial Recognition Web App</h1>
          <h5>Created by Connor McGartland</h5>
        </header>
  
        {/* Main content area */}
        <div className="homepage-container">
          <div className="card-container">
            {/* Webcam Card */}
            <div className="custom-card webcam-card">
              <h2>Use Your Webcam!</h2>
              <p>Try it on yourself! Use your webcam to detect and track faces in real-time with name, age, gender, and emotion analysis.</p>
              <img
                src="/home_images/Webcam.jpg" 
                alt="Example of webcam face recognition"
                className="custom-card-image"
            />
              <Link to="/webcam" className="btn btn-light">
                Start Webcam
              </Link>
            </div>
  
            {/* Upload Card */}
            <div className="custom-card upload-card">
              <h2>Upload An Image!</h2>
              <p>Try it on your favorite celebrity! Upload a photo to detect faces and display face recognition data with overlays.</p>
              <img
                src="/home_images/Upload.jpg" 
                alt="Example of webcam face recognition"
                className="custom-card-image"
              />
              <Link to="/upload" className="btn btn-light">
                Upload an Image
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  export default HomePage;