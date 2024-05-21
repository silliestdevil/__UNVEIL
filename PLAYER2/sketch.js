// p5.js interface to Google MediaPipe Landmark Tracking 
// Tracks 478 points on the face, and calculates 52 face metrics.
// See https://mediapipe-studio.webapps.google.com/home
// Uses p5.js v.1.8.0 + MediaPipe v.0.10.7
// By Golan Levin, version of 10/29/2023
// Huge thanks to Orr Kislev, who made it work in p5's global mode!
// Based off of: https://editor.p5js.org/golan/sketches/0yyu6uEwM

// Don't change the names of these global variables.
let myFaceLandmarker;
let faceLandmarks;
let myCapture;
let lastVideoTime = -1;
let extra;

// Works best with just one or two sets of landmarks.
const trackingConfig = {
  doAcquireFaceMetrics: true,
  cpuOrGpuString: "GPU", /* "GPU" or "CPU" */
  maxNumFaces: 1, // number of faces to track
};

//------------------------------------------
//loads the mediapipe Facelandmarker and sets up thhe fileset resolver for vision tasks
async function preload() {
  const mediapipe_module = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js');
  FaceLandmarker = mediapipe_module.FaceLandmarker;
  FilesetResolver = mediapipe_module.FilesetResolver;
  
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm"
  );
  
  // Face Landmark Tracking:
  // https://codepen.io/mediapipe-preview/pen/OJBVQJm
  // https://developers.google.com/mediapipe/solutions/vision/face_landmarker
	myFaceLandmarker = await FaceLandmarker.createFromOptions(vision, {
		numFaces: trackingConfig.maxNumFaces,
		runningMode: "VIDEO",
		outputFaceBlendshapes:trackingConfig.doAcquireFaceMetrics,
		baseOptions: {
			delegate: trackingConfig.cpuOrGpuString,
			modelAssetPath:
				"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
		},
	});
}

//------------------------------------------
//function to continously process video frames from the webcam using 'requestAnimationFrame'
async function predictWebcam() {
  let startTimeMs = performance.now();
  if (lastVideoTime !== myCapture.elt.currentTime) {
    if (myFaceLandmarker) {
      faceLandmarks = myFaceLandmarker.detectForVideo(myCapture.elt,startTimeMs);
    }
    lastVideoTime = myCapture.elt.currentTime;
  }
  window.requestAnimationFrame(predictWebcam);
}

//------------------------------------------
///setup function: Initializes the canvas and sets up the webcam capture
function setup() {
  createCanvas(800, 600);
  myCapture = createCapture(VIDEO);
  myCapture.size(320, 240);
  myCapture.hide();
  extra = createGraphics(200,100); 
  extra.background(255,0,0);
}

function draw() { 
  background("white");
  predictWebcam();
  drawVideoBackground();
  drawFacePoints();
  drawFaceMetrics();
  drawDiagnosticInfo(); 
  
}

//------------------------------------------
function drawVideoBackground() { //function to draw the webcam video feed as the background 
  push();
  translate(width, 0);
  scale(-1, 1);
  tint(255, 255, 255, 72);
  image(myCapture, 0, 0, width, height);
  tint(255);
  pop();
}

//------------------------------------------
// Tracks 478 points on the face. 
function drawFacePoints() { //draw the detected face landmarks
	if (faceLandmarks && faceLandmarks.faceLandmarks) {
		const nFaces = faceLandmarks.faceLandmarks.length;
		if (nFaces > 0) {
			for (let f = 0; f < nFaces; f++) {
				let aFace = faceLandmarks.faceLandmarks[f];
				if (aFace) {
					let nFaceLandmarks = aFace.length;

					noFill();
					stroke("black");
					strokeWeight(1.0);
					for (let i = 0; i < nFaceLandmarks; i++) {
						let px = aFace[i].x;
						let py = aFace[i].y;
						px = map(px, 0, 1, width, 0);
						py = map(py, 0, 1, 0, height);
						circle(px, py, 1);
					}

					noFill();
					stroke("black");
					strokeWeight(2.0);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LIPS);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS);
					drawConnectors(aFace, FACELANDMARKER_NOSE); // Google offers no nose
				}
			}
		}
	}
}

function drawFaceMetrics(){ //draw the calculated face metrics
  if (trackingConfig.doAcquireFaceMetrics){
    if (faceLandmarks && faceLandmarks.faceBlendshapes) {
      const nFaces = faceLandmarks.faceLandmarks.length;
      for (let f = 0; f < nFaces; f++) {
        let aFaceMetrics = faceLandmarks.faceBlendshapes[f];
        if (aFaceMetrics){
          
          fill('black'); 
          textSize(10.5); 
          let tx = 50; 
          let ty = 40; 
          let dy = 11;
          let vx0 = tx-5; 
          let vx1 = 5;
          
        
          let nMetrics = aFaceMetrics.categories.length; 
          for (let i=1; i<nMetrics; i++){
            let metricName = aFaceMetrics.categories[i].categoryName;
            noStroke();
            text(metricName, tx,ty); 
            
            let metricValue = aFaceMetrics.categories[i].score;
            let vx = map(metricValue,0,1,vx0,vx1);
            stroke(0,0,0); 
            strokeWeight(2.0); 
            line(vx0,ty-2, vx,ty-2); 
            stroke(0,0,0,20);
            line(vx0,ty-2, vx1,ty-2); 
            ty+=dy;
          }

          image(extra, 200, 200);
              // Log the value of 'facepucker' metric

              //talking function If talking 
              // let mouthPucker = aFaceMetrics.categories.find(category => category.categoryName === 'mouthPucker');
              // let jawOpen = aFaceMetrics.categories.find(category => category.categoryName === 'jawOpen');
              let mouthLowerDownLeft = aFaceMetrics.categories.find(category => category.categoryName === 'mouthLowerDownLeft');
              let mouthUpperUpRight = aFaceMetrics.categories.find(category => category.categoryName === 'mouthUpperUpRight');
              let browOuterUpLeft = aFaceMetrics.categories.find(category => category.categoryName === 'browOuterUpLeft');
              let browOuterUpRight = aFaceMetrics.categories.find(category => category.categoryName === 'browOuterUpRight');
              
              if ((mouthUpperUpRight && mouthUpperUpRight.score < 0.1) || (mouthLowerDownLeft && mouthLowerDownLeft.score < 0.1)) {
                  extra.text("talking", 10, 20);
                  extra.clear();
              } else {
                  extra.clear();
                  extra.color(266);
                  extra.text("talking", 10, 20);
              }
              
              if ((browOuterUpLeft && browOuterUpLeft.score >= 0.8) || (browOuterUpRight && browOuterUpRight.score >= 0.8)) {
                  console.log("eyebrowRaise");
              }
              

        }
      }
    }
  }
}


//------------------------------------------
function drawConnectors(landmarks, connectorSet) {//draw lines connecting specific landmark points
  if (landmarks) {
    let nConnectors = connectorSet.length;
    for (let i=0; i<nConnectors; i++){
      let index0 = connectorSet[i].start; 
      let index1 = connectorSet[i].end;
      let x0 = map(landmarks[index0].x, 0,1, width,0);
      let y0 = map(landmarks[index0].y, 0,1, 0,height);
      let x1 = map(landmarks[index1].x, 0,1, width,0);
      let y1 = map(landmarks[index1].y, 0,1, 0,height);
      line(x0,y0, x1,y1); 
    }
  }
}

//------------------------------------------
function drawDiagnosticInfo() { //draw diagnostic information life frames per second 
  noStroke();
  fill("black");
  textSize(12); 
  text("FPS: " + int(frameRate()), 50, 27);
}


//  make the mouth talking function fully work
// Add a count down where the user has to life eyebrows