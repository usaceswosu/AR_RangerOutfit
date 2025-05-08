//html elements
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

//loading png images
const hatImg = new Image();
hatImg.src = 'images/ranger_hat.png';
const vestImg = new Image();
vestImg.src = 'images/ranger_vest.png';

videoElement.onloadedmetadata = () => {
  const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;

  //matching canvas size with camera
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  //making canvas and video fit the screen
  if (window.innerWidth / window.innerHeight > aspectRatio) {
    //wide screen
    videoElement.style.width = 'auto';
    videoElement.style.height = '100vh';
    canvasElement.style.width = 'auto';
    canvasElement.style.height = '100vh';
  } else {
    //tall screen
    videoElement.style.width = '100vw';
    videoElement.style.height = 'auto';
    canvasElement.style.width = '100vw';
    canvasElement.style.height = 'auto';
  }
};

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  videoElement.srcObject = stream;
});

//mediapipe pose detection
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

//pose options
pose.setOptions({
  modelComplexity: 0,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

//when pose detects results draws live camera feed onto the canvas
pose.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  //if no body detected, exit
  if (!results.poseLandmarks) return;

  //key body landmarks
  const landmarks = results.poseLandmarks;
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!nose || !leftShoulder || !rightShoulder) return;

  const w = canvasElement.width;
  const h = canvasElement.height;

  //calculate landmark positions relative to canvas size
  const noseX = nose.x * w;
  const noseY = nose.y * h;
  const leftX = leftShoulder.x * w;
  const leftY = leftShoulder.y * h;
  const rightX = rightShoulder.x * w;

  const shoulderWidth = Math.abs(rightX - leftX);

  //hat
  const hatWidth = shoulderWidth * 1.2;  //width and height slider
  const hatHeight = hatWidth;  //height slider if needed
  const hatX = noseX - hatWidth / 2 - 2;  //left and right
  const hatY = noseY - hatHeight * 0.68;  //up and down

  canvasCtx.drawImage(hatImg, hatX, hatY, hatWidth, hatHeight);

  //vest
  const vestWidth = shoulderWidth * 1.8;  //width slider
  const vestHeight = vestWidth * 0.8;  //height slider
  const vestX = (leftX + rightX) / 2 - vestWidth / 2;  //left and right
  const vestY = leftY - vestHeight * 0.18;  //up and down

  canvasCtx.drawImage(vestImg, vestX, vestY, vestWidth, vestHeight);
});

//start mediapip camera to track body pose
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();
