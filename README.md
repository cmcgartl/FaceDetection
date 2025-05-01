# Facial Recognition Web App

This is a facial recognition web application that allows allows a user to use their live webcam feed or upload a photo and perform facial recognition using the pre-trained face-api.js libryary built on TensorFlow.js. The facial recognition creates an overlay indicating the location and size of detected faces, as well as predicted name, age, gender, and expression. 

This app was built with **React**, **TypeScript**, and **Redux**, styled using **CSS**, **HTML**, and **Bootstrap**, and deployed to **Google Cloud Platform (GCP)** via **Firebase Hosting**.

### Check out the demo or try it for yourself!

> 📺 [Watch the Demo Video](https://www.loom.com/share/93df3f58ebe7471caa85c1fc701aeec7?sid=b954c8b6-8298-4da5-a43c-19c26064d98f))  
> 🌐 [Live App](https://cmcgartlfacerec.web.app))  

---

## Features

- Start and Stop live webcam feed using
- Upload an image from device
- Perform face detection with **face-api.js** (TinyFaceDetector)
- Display:
  - Bounding box around each detected face
  - Closest matching name to detected face or "unknown" if not recognized
  - Age and gender
  - Emotion recognition
- Handle **multiple faces** in real-time
- Fully **responsive design** for mobile and desktop

---

## Tech Stack

| Area                | Tech Stack                                  |
|---------------------|---------------------------------------------|
| Framework           | React 18, TypeScript                        |
| Styling             | Bootstrap 5, CSS Modules                    |
| Facial Recognition  | face-api.js (TensorFlow.js-based)           |
| State Management    | Redux (with `@reduxjs/toolkit`)             |
| Hosting / Deployment| Firebase Hosting (GCP)                      |
| Media Access        | Web APIs (`getUserMedia`)                   |

---

