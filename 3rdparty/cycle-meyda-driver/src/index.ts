import xs from 'xstream';
import Meyda from 'meyda';
import {adapt} from '@cycle/run/lib/adapt';

/**
 * [Meyda](https://github.com/meyda/meyda) audio feature extraction driver factory.
 *
 * @param options a subset of MeydaOptions (https://meyda.js.org/reference/module-meyda.html)
 *
 *   * bufferSize? {number}
 *   * hopSize? {number}
 *   * sampleRate? {number}
 *   * windowingFunction? {string}
 *   * featureExtractors? {string[]}
 *
 * @return {Driver} the Meyda Cycle.js driver function. It takes no stream
 *   and returns a stream of audio features.
 *
 */
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

  // NOTE: featureExtractors should default to ['rms']
  //   https://meyda.js.org/reference/module-meyda.html
  //   but it doesn't
  //   https://github.com/meyda/meyda/blob/master/src/meyda-wa.js#L59
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
          context.resume();
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
