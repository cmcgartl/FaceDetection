import * as faceapi from 'face-api.js';

const MODEL_URL = process.env.PUBLIC_URL + '/models';

export const loadModels = async () => {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
  ]);
  console.log("Face-api.js models loaded successfully 🚀");
};

export const loadLabeledImages = async () => {
  const labels = ['Connor']; // Example names
  return Promise.all(
    labels.map(async (label) => {
      const imgUrl = `/labeled_images/${label}.jpg`; // Assuming structure like /public/labeled_images/Connor.jpg
      const img = await faceapi.fetchImage(imgUrl);
      const detection = await faceapi
        .detectSingleFace(img)
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
