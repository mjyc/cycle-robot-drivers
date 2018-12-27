import xs from 'xstream';
import Meyda from 'meyda';
import {adapt} from '@cycle/run/lib/adapt';

export function makeMeydaDriver() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw 'Browser API navigator.mediaDevices.getUserMedia not available';
  }

  const bufferSize = 1024;  // TODO: parameterize it
  let context = null;
  let meyda = null;

  return function() {
    context = new AudioContext();
    navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': false,
    }).then((mediaStream) => {
      const source = context.createMediaStreamSource(mediaStream);
      meyda = Meyda.createMeydaAnalyzer({
        audioContext: context,
        source: source,
        bufferSize: bufferSize,  // TODO: parameterize it options = {bufferSize: ..., windowingFunction: ...}
        windowingFunction: 'blackman',  // TODO: parameterize it
      });
    }).catch((err) => {
      console.error(err);
      throw 'Failed to create Meyda analyzer';
    });

    const source$ = xs.periodic(500)  // make it dependent on $sink?
      .map(dummy => (!meyda ? null : meyda.get(['rms'])))
      .filter(f => !!f);
    return adapt(source$);
  }
}
