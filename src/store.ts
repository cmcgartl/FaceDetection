// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import detectionReducer from './Slices/detectionSlice';

export const store = configureStore({
  reducer: {
    detection: detectionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
