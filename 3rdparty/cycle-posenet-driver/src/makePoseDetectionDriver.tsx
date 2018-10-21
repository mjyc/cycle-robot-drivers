import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {Stream} from 'xstream';
import {Driver} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import dat from 'dat.gui';
import Stats from 'stats.js';
import * as posenet from '@tensorflow-models/posenet';
import {drawSkeleton, drawKeypoints, isMobile, setupCamera} from './utils';


// adapted from
//   https://github.com/tensorflow/tfjs-models/blob/fc0a80d8ddbd2845fca4a61355dc5c54d1b43e0d/posenet/demos/camera.js#L102-L182
// Sets up dat.gui controller on the top-right of the window
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
  single.open();

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

export type PoseNetParameters = {
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
  fps: number,
  stopRequested: boolean,
};

/**
 * [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) 
 * driver factory.
 * 
 * @param options possible key includes
 * 
 *   * videoWidth {number} An optional video height (default: 640).
 *   * videoWidth {number} An optional video width (default: 480).
 *   * flipHorizontal {boolean} An optional flag for horizontally flipping the
 *     video (default: true).
 * 
 * @return {Driver} the PoseNet Cycle.js driver function. It takes a stream
 *   of [`PoseNetParameters`](./src/pose_detection.tsx) and returns a stream of
 *   [`Pose` arrays](https://github.com/tensorflow/tfjs-models/tree/master/posenet#via-npm).
 * 
 */
export function makePoseDetectionDriver({
  videoWidth = 640,
  videoHeight = 480,
  flipHorizontal = true,
}: {
  videoWidth?: number,
  videoHeight?: number,
  flipHorizontal?: boolean,
} = {}): Driver<
  any,
  {DOM: any, poses: any}
> {
  const id = String(Math.random()).substr(2);
  const divID = `posenet-${id}`;
  const videoID = `pose-video-${id}`;
  const canvasID = `pose-canvas-${id}`;

  return function(params$: Stream<PoseNetParameters>): any {
    let params: PoseNetParameters = null;
    const initialParams = {
      algorithm: 'single-pose',
      input: {
        mobileNetArchitecture: isMobile() ? '0.50' : '0.75',
        outputStride: 16,
        imageScaleFactor: isMobile() ? 0.2 : 0.5,
      },
      singlePoseDetection: {
        minPoseConfidence: 0.2,
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
      fps: isMobile() ? 5 : 10,
      stopRequested: false,
    };
    params$.fold((prev: PoseNetParameters, params: PoseNetParameters) => {
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
      next: (newParams: PoseNetParameters) => {
        params = newParams;
      }
    });

    async function poseDetectionFrame(params, video, context, callback) {
      if (params.changeToArchitecture) {
        // Important to purge variables and free up GPU memory
        params.net.dispose();

        // Load the PoseNet model weights for either the 0.50, 0.75, 1.00, or
        // 1.01 version
        params.net = await posenet.load((+params.changeToArchitecture as any));

        params.changeToArchitecture = null;
      }

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
          keypoints: pose.keypoints.filter(
            keypoint => keypoint.score >= minPartConfidence
          ),
        }));

      if (callback) {
        callback(outPoses);
      }
    }

    let timeoutId = {};
    const poses$ = xs.create({
      start: listener => {
        // Poll the canvas element
        const intervalID = setInterval(async () => {
          if (!document.querySelector(`#${canvasID}`)) {
            console.debug(`Waiting for #${canvasID} to appear...`);
            return;
          }
          clearInterval(intervalID);
    
          // Setup a camera
          const video: any = await setupCamera(
            document.querySelector(`#${videoID}`),
            videoWidth,
            videoHeight
          );
          video.play();
  
          const canvas: any = document.querySelector(`#${canvasID}`);
          const context = canvas.getContext('2d');
          canvas.width = videoWidth;
          canvas.height = videoHeight;
  
          // Setup the posenet
          params.net = await posenet.load(0.75);

          // Setup the main loop
          const stats = new Stats();
          const interval = 1000 / params.fps;
          let start = Date.now();
          const execute = async () => {
            const elapsed = Date.now() - start;
            if (elapsed > interval) {
              stats.begin();
              start = Date.now();
              await poseDetectionFrame(params, video, context, listener.next.bind(listener));
              stats.end();
              if (!timeoutId) return;
              timeoutId = setTimeout(execute, 0);
            } else {
              if (!timeoutId) return;
              this._timeoutId = setTimeout(execute, interval - elapsed);
            }
          }
          execute();
  
          // Setup UIs
          stats.showPanel(0);
          stats.dom.style.setProperty('position', 'absolute');
          document.querySelector(`#${divID}`).appendChild(stats.dom);
  
          const gui = setupGui(video, params.net, params);
          gui.domElement.style.setProperty('position', 'absolute');
          gui.domElement.style.setProperty('top', '0px');
          gui.domElement.style.setProperty('right', '0px');
          document.querySelector(`#${divID}`)
            .appendChild(gui.domElement);
          gui.closed = true;
        }, 1000);
      },
      stop: () => {
        timeoutId = null;
      },
    });

    const vdom$ = xs.of((
      <div id={divID} style={{position: "relative"}}>
        <video
          id={videoID}
          style={{display: 'none'}}
          autoPlay
        />
        <canvas id={canvasID} />
      </div>
    ));

    return {
      DOM: adapt(vdom$),
      poses: adapt(poses$),
    };
  }
}
