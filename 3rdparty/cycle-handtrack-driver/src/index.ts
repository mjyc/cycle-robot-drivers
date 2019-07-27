const xs = require("xstream").default;
const handTrack = require("handtrackjs/dist/handtrack.min.js"); // copied from v0.0.13

const makeHandTrackDriver = ({ model = null, modelParams = {} } = {}) => {
  modelParams = {
    flipHorizontal: true, // flip e.g for video
    maxNumBoxes: 2, // maximum number of boxes to detect
    iouThreshold: 0.5, // ioU threshold for non-max suppression
    scoreThreshold: 0.6, // confidence threshold for predictions.
    ...modelParams
  };

  const runDetection = (model, video, canvas, listener) => {
    const context = canvas.getContext("2d");
    const runDetectionHelper = () => {
      model.detect(video).then(predictions => {
        listener.next(predictions);
        model.renderPredictions(predictions, canvas, context, video);
        requestAnimationFrame(runDetectionHelper);
      });
    };
    runDetectionHelper();
  };

  return command$ => {
    const output$ = xs.create({
      start: listener => {
        command$.addListener({
          next: cmd => {
            if (cmd.type === "start") {
              const [video, canvas] = cmd.elems;
              handTrack.startVideo(video).then(status => {
                if (status) {
                  if (!model) {
                    handTrack.load(modelParams).then(model => {
                      runDetection(model, video, canvas, listener);
                    });
                  } else {
                    runDetection(model, video, canvas, listener);
                  }
                } else {
                  listener.error("Cannot start video");
                }
              });
            }
          }
        });
      },
      stop: () => {}
    });
    return output$;
  };
};

export { makeHandTrackDriver };
