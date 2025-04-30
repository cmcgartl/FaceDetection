import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WebcamPage from './pages/WebcamPage';
import UploadPage from './pages/UploadPage';
import 'bootstrap/dist/css/bootstrap.min.css';

const App: React.FC = () => {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/webcam" element={<WebcamPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<Navigate to="/" />} /> {/* Redirect any unknown path to Home */}
        </Routes>
    </Router>
  );
};

export default App;
