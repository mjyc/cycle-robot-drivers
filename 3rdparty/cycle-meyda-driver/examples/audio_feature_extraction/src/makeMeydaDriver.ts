import xs from 'xstream';
import Meyda from 'meyda';
import { adapt } from '@cycle/run/lib/adapt';

export function makeMeydaDriver() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw 'Browser API navigator.mediaDevices.getUserMedia not available';
  }

  const bufferSize = 1024;
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
        bufferSize: bufferSize,
        windowingFunction: 'blackman',
      });
    }).catch((err) => {
      console.error(err);
      throw 'Failed to create Meyda analyzer';
    });

    const source$ = xs.periodic(500)
      .map(dummy => (!meyda ? null : meyda.get(['rms'])))
      .filter(f => !!f);
    return adapt(source$);
  }
}
