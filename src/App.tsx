import React from 'react';
import WebcamFeed from './WebcamFeed';
import 'bootstrap/dist/css/bootstrap.min.css';

const App: React.FC = () => {
  return (
    <div className="container mt-5">
      <h1 className="text-center">Webcam Face Recognition</h1>
      <WebcamFeed />
    </div>
  );
};

export default App;
