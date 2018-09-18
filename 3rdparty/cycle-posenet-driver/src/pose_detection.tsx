import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {Driver} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import dat from 'dat.gui';
import Stats from 'stats.js';
import * as posenet from '@tensorflow-models/posenet';
import {drawSkeleton, drawKeypoints, isMobile, setupCamera} from './utils';


// adapted from
//   https://github.com/tensorflow/tfjs-models/blob/fc0a80d8ddbd2845fca4a61355dc5c54d1b43e0d/posenet/demos/camera.js#L102-L182
/**
 * Sets up dat.gui controller on the top-right of the window
 */
function setupGui(cameras, net, guiState) {
  guiState.net = net;

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }

  const gui = new dat.GUI({width: 300, autoPlace: false});

  // The single-pose algorithm is faster and simpler but requires only one
  // person to be in the frame or results will be innaccurate. Multi-pose works
  // for more than 1 person
  const algorithmController =
      gui.add(guiState, 'algorithm', ['single-pose', 'multi-pose']);

  // The input parameters have the most effect on accuracy and speed of the
  // network
  let input = gui.addFolder('Input');
  // Architecture: there are a few PoseNet models varying in size and
  // accuracy. 1.01 is the largest, but will be the slowest. 0.50 is the
  // fastest, but least accurate.
  const architectureController = input.add(
      guiState.input, 'mobileNetArchitecture',
      ['1.01', '1.00', '0.75', '0.50']);
  // Output stride:  Internally, this parameter affects the height and width of
  // the layers in the neural network. The lower the value of the output stride
  // the higher the accuracy but slower the speed, the higher the value the
  // faster the speed but lower the accuracy.
  input.add(guiState.input, 'outputStride', [8, 16, 32]);
  // Image scale factor: What to scale the image by before feeding it through
  // the network.
  input.add(guiState.input, 'imageScaleFactor').min(0.2).max(1.0);
  input.open();

  // Pose confidence: the overall confidence in the estimation of a person's
  // pose (i.e. a person detected in a frame)
  // Min part confidence: the confidence that a particular estimated keypoint
  // position is accurate (i.e. the elbow's position)
  let single = gui.addFolder('Single Pose Detection');
  single.add(guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
  single.add(guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);

  let multi = gui.addFolder('Multi Pose Detection');
  multi.add(guiState.multiPoseDetection, 'maxPoseDetections')
    .min(1)
    .max(20)
    .step(1);
  multi.add(guiState.multiPoseDetection, 'minPoseConfidence', 0.0, 1.0);
  multi.add(guiState.multiPoseDetection, 'minPartConfidence', 0.0, 1.0);
  // nms Radius: controls the minimum distance between poses that are returned
  // defaults to 20, which is probably fine for most use cases
  multi.add(guiState.multiPoseDetection, 'nmsRadius').min(0.0).max(40.0);
  multi.open();

  let output = gui.addFolder('Output');
  output.add(guiState.output, 'showVideo');
  output.add(guiState.output, 'showSkeleton');
  output.add(guiState.output, 'showPoints');
  output.open();


  architectureController.onChange(function(architecture) {
    guiState.changeToArchitecture = architecture;
  });

  algorithmController.onChange(function(value) {
    switch (guiState.algorithm) {
      case 'single-pose':
        multi.close();
        single.open();
        break;
      case 'multi-pose':
        single.close();
        multi.open();
        break;
    }
  });

  return gui;
}

type Parameters = {
  algorithm: string,
  input: {
    mobileNetArchitecture: string,
    outputStride: number,
    imageScaleFactor: number,
  },
  singlePoseDetection: {
    minPoseConfidence: number,
    minPartConfidence: number,
  },
  multiPoseDetection: {
    maxPoseDetections: number,
    minPoseConfidence: number,
    minPartConfidence: number,
    nmsRadius: number,
  },
  output: {
    showVideo: boolean,
    showSkeleton: boolean,
    showPoints: boolean,
  },
  net: any,
  changeToArchitecture: string,
};

export function makePoseDetectionDriver({
  videoWidth = 640,
  videoHeight = 480,
  flipHorizontal = true,
}: {
  videoWidth?: number,
  videoHeight?: number,
  flipHorizontal?: boolean,
} = {}): Driver<any, any> {
  const stats = new Stats();

  return function(params$) {
    let params = null;
    let video = null;
    let context = null;

    let posesListener = null;
    const poses$ = xs.create({
      start: listener => {
        posesListener = (result) => {
          listener.next(result);
        };
      },
      stop: () => {
        posesListener = null;
      },
    });

    async function poseDetectionFrame() {
      if (params.changeToArchitecture) {
        // Important to purge variables and free up GPU memory
        params.net.dispose();

        // Load the PoseNet model weights for either the 0.50, 0.75, 1.00, or
        // 1.01 version
        params.net = await posenet.load((+params.changeToArchitecture as any));

        params.changeToArchitecture = null;
      }

      // Begin monitoring code for frames per second
      stats.begin();

      // Scale an image down to a certain factor. Too large of an image will
      // slow down the GPU
      const imageScaleFactor = params.input.imageScaleFactor;
      const outputStride = +params.input.outputStride;

      let poses = [];
      let minPoseConfidence;
      let minPartConfidence;
      switch (params.algorithm) {
        case 'single-pose':
          const pose = await params.net.estimateSinglePose(
              video, imageScaleFactor, flipHorizontal, outputStride);
          poses.push(pose);

          minPoseConfidence = +params.singlePoseDetection.minPoseConfidence;
          minPartConfidence = +params.singlePoseDetection.minPartConfidence;
          break;
        case 'multi-pose':
          poses = await params.net.estimateMultiplePoses(
              video, imageScaleFactor, flipHorizontal, outputStride,
              params.multiPoseDetection.maxPoseDetections,
              params.multiPoseDetection.minPartConfidence,
              params.multiPoseDetection.nmsRadius);

          minPoseConfidence = +params.multiPoseDetection.minPoseConfidence;
          minPartConfidence = +params.multiPoseDetection.minPartConfidence;
          break;
      }

      context.clearRect(0, 0, videoWidth, videoHeight);

      if (params.output.showVideo) {
        context.save();
        context.scale(-1, 1);
        context.translate(-videoWidth, 0);
        context.drawImage(video, 0, 0, videoWidth, videoHeight);
        context.restore();
      }

      // For each pose (i.e. person) detected in an image, loop through the
      // poses and draw the resulting skeleton and keypoints if over certain
      // confidence scores
      poses.forEach(({score, keypoints}) => {
        if (score >= minPoseConfidence) {
          if (params.output.showPoints) {
            drawKeypoints(keypoints, minPartConfidence, context);
          }
          if (params.output.showSkeleton) {
            drawSkeleton(keypoints, minPartConfidence, context);
          }
        }
      });
      const outPoses = poses
        .filter(pose => pose.score >= minPoseConfidence)
        .map(pose => ({
          ...pose,
          keypoints: pose.keypoints.filter(keypoint => keypoint.score >= minPartConfidence)
        }));

      if (posesListener) {
        posesListener(outPoses);

        // End monitoring code for frames per second
        stats.end();

        requestAnimationFrame(poseDetectionFrame);
      }
    }

    // Poll for the element with id='#pose_detection_canvas'
    const intervalID = setInterval(async () => {
      if (!document.querySelector('#pose_detection_canvas')) {
        console.debug('Waiting for #pose_detection_canvas to appear...');
        return;
      }
      clearInterval(intervalID);

      if (!video) {
        video = await setupCamera(
          document.querySelector('#pose_detection_video'), videoWidth, videoHeight);
        video.play();

        const canvas: any = document.querySelector('#pose_detection_canvas');
        context = canvas.getContext('2d');
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        params.net = await posenet.load(0.75);
        poseDetectionFrame();

        stats.showPanel(0);
        stats.dom.style.setProperty('position', 'absolute');
        document.querySelector('#pose_detection').appendChild(stats.dom);

        const gui = setupGui(video, params.net, params);
        gui.domElement.style.setProperty('position', 'absolute');
        gui.domElement.style.setProperty('top', '0px');
        gui.domElement.style.setProperty('right', '0px');
        document.querySelector('#pose_detection').appendChild(gui.domElement);
        gui.closed = true;
      } else {
        console.warn('video is already set');
      }
    });

    const initialParams = {
      algorithm: 'multi-pose',
      input: {
        mobileNetArchitecture: isMobile() ? '0.50' : '0.75',
        outputStride: 16,
        imageScaleFactor: 0.5,
      },
      singlePoseDetection: {
        minPoseConfidence: 0.1,
        minPartConfidence: 0.5,
      },
      multiPoseDetection: {
        maxPoseDetections: 5,
        minPoseConfidence: 0.15,
        minPartConfidence: 0.1,
        nmsRadius: 30.0,
      },
      output: {
        showVideo: true,
        showSkeleton: true,
        showPoints: true,
      },
      net: null,
      changeToArchitecture: null,
    };

    params$.fold((prev: Parameters, params: Parameters) => {
      Object.keys(params).map(key => {
        if (typeof params[key] === 'object') {
          Object.assign(prev[key], params[key]);
        } else {
          prev[key] = params[key];
        }
        return prev;
      });
      return prev;
    }, initialParams).addListener({
      next: (newParams: Parameters) => {
        params = newParams;
      }
    });

    const vdom$ = xs.of((
      <div id="pose_detection" style={{position: "relative"}}>
        <video
          id="pose_detection_video"
          style={{display: 'none'}}
          autoPlay
        />
        <canvas id="pose_detection_canvas" />
      </div>
    ));
    return {
      DOM: adapt(vdom$),
      poses: adapt(poses$),
    };
  }
}
