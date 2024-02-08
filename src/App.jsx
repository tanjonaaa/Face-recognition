import "./App.css";
import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";

const MODEL_URL = "/models";

const loadModels = async () => {
  await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
  await faceapi.loadFaceLandmarkModel(MODEL_URL);
  await faceapi.loadFaceRecognitionModel(MODEL_URL);
};

const team = [
  {
    name: "tanjona",
    picture: "/pictures/tanjona-1.jpg",
  },
  {
    name: "fiantso",
    picture: "/pictures/fiantso-1.jpg",
  },
  {
    name: "tendry",
    picture: "/pictures/tendry-1.jpg",
  },
];

function App() {
  const imageRef = useRef(null);
  const canvaRef = useRef(null);
  const [picture, setPicture] = useState(null);
  const [references, setReferences] = useState([]);
  const [match, setMatch] = useState(null);

  const loadReferences = async (data) => {
    const labeledFaceDescriptors = await Promise.all(
      data.map(async (user) => {
        const img = await faceapi.fetchImage(user.picture);

        const fullFaceDescription = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!fullFaceDescription) {
          throw new Error(`no faces detected for ${user.name}`);
        }

        const faceDescriptors = [fullFaceDescription.descriptor];
        return new faceapi.LabeledFaceDescriptors(user.name, faceDescriptors);
      })
    );

    return labeledFaceDescriptors;
  };

  const displayImage = (e) => {
    setPicture(URL.createObjectURL(e.target.files[0]));
  };

  const launchRecognition = async () => {
    if (picture !== null) {
      const image = imageRef.current;
      const canva = canvaRef.current;

      canva.width = image.width;
      canva.height = image.height;

      const pictureDescriptor = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();

      faceapi.draw.drawDetections(canva, pictureDescriptor);
      faceapi.draw.drawFaceLandmarks(canva, pictureDescriptor);

      const maxDescriptorDistance = 0.6;
      const faceMatcher = new faceapi.FaceMatcher(
        references,
        maxDescriptorDistance
      );

      const occurence = faceMatcher.findBestMatch(pictureDescriptor.descriptor);

      const match =
        occurence.label !== "unknown"
          ? team.filter((user) => user.name === occurence.label)[0]
          : null;

      setMatch(match);
      console.log(match);
    }
  };

  useEffect(() => {
    loadModels().then(() => {
      loadReferences(team).then((descriptions) => setReferences(descriptions));
    });
  }, []);

  return (
    <>
      <label htmlFor="fileInput">Upload a picture</label>
      <input onChange={displayImage} type="file" id="fileInput" />
      <button onClick={launchRecognition}>Process recognition</button>
      {picture && (
        <div className="container">
          <div className="left">
            <img src={picture} ref={imageRef} />
            <canvas ref={canvaRef} />
          </div>
          <div className="right"></div>
        </div>
      )}
    </>
  );
}

export default App;
