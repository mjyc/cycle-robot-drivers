import xs from 'xstream';
import Meyda from 'meyda';
import {adapt} from '@cycle/run/lib/adapt';

export function makeMeydaDriver(options: {
  bufferSize?: number,
  hopSize?: number,
  sampleRate?: number,
  windowingFunction?: string,
  featureExtractors?: string[],
} = {}) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw 'Browser API navigator.mediaDevices.getUserMedia not available';
  }

  // NOTE: https://github.com/meyda/meyda/blob/master/src/meyda-wa.js#L59
  //   which is not implemented as explained in documentation:
  //   https://meyda.js.org/reference/module-meyda.html
  if (!options.featureExtractors) {
    options.featureExtractors = ['rms'];
  }

  const context = new AudioContext();
  let meyda = null;

  return function() {
    const source$ = xs.create({
      start: listener => {
        navigator.mediaDevices.getUserMedia({
          'audio': true,
          'video': false,
        }).then((stream) => {
          const source = context.createMediaStreamSource(stream);
          meyda = Meyda.createMeydaAnalyzer({
            ...options,
            startImmediately: true,
            audioContext: context,
            source: source,
            callback: features => listener.next(features),
          });
        }).catch((err) => {
          console.error(err);
          throw 'Failed to create Meyda analyzer';
        });
      },
      stop: () => {},
    })

    return adapt(source$);
  }
}
