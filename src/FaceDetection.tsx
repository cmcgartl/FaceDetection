import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

export const loadModels = async () => {
    console.log("loadModels() called");

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
  ]);
  console.log("Face-api.js models loaded successfully 🚀");
};

export const loadLabeledImages = async () => {
    const labels = ['Connor', 'Quentin-Tarantino', 'Samuel-L-Jackson'];
    return Promise.all(
      labels.map(async (label) => {
        const imgUrl = `/labeled_images/${label}.jpg`;
        const img = await faceapi.fetchImage(imgUrl);
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
  
        if (!detection) {
          throw new Error(`No face detected for ${label}`);
        }
  
        return new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]);
      })
    );
  };
  

export { faceapi };
