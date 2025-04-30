// src/slices/detectionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DetectionState {
  detections: any[];
  isCameraOn: boolean;
}

const initialState: DetectionState = {
  detections: [],
  isCameraOn: false,
};

export const detectionSlice = createSlice({
  name: 'detection',
  initialState,
  reducers: {
    setDetections: (state, action: PayloadAction<any[]>) => {
      state.detections = action.payload;
    },
    setCameraOn: (state, action: PayloadAction<boolean>) => {
      state.isCameraOn = action.payload;
    },
    resetDetections: (state) => {
      state.detections = [];
    },
  },
});

export const { setDetections, setCameraOn, resetDetections } = detectionSlice.actions;
export default detectionSlice.reducer;
