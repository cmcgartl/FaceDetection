import React from 'react';

// Define the expected props for the FaceOverlay component
interface FaceOverlayProps {
  box: { x: number; y: number; width: number; height: number }; // Face bounding box position and size
  label: string; // Label to facial recognition data like name, age, gender

  // Shrink factor to fix issues with bounding box being too large
  shrinkFactor?: number; //set to 1 by default
  scale?: { x: number; y: number }; // scaling for when images are resized
}

// Reusable component for drawing a green face bounding box with a label
const FaceOverlay: React.FC<FaceOverlayProps> = ({ box, label, shrinkFactor = 1, scale }) => {
  // Destructure the box dimensions
  const { x, y, width, height } = box;

  // If scaling is required, adjust the bounding box dimensions
  const scaleX = scale ? scale.x : 1;
  const scaleY = scale ? scale.y : 1;

  // Apply shrink factor and scaling to buonding box
  const adjustedWidth = width * scaleX * shrinkFactor;
  const adjustedHeight = height * scaleY * shrinkFactor;
  const adjustedLeft = (x * scaleX) + (width * scaleX * (1 - shrinkFactor) / 2);
  const adjustedTop = (y * scaleY) + (height * scaleY * (1 - shrinkFactor) / 2);
  return (
    //display the shrunk/scaled bounding box
    <div
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
      {/* Label displayed above the box */}
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
};

export default FaceOverlay;
