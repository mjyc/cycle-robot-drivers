import xs from 'xstream';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';

// TODO: update this
// import Meyda from 'meyda';
declare var require: any
var Meyda = require('meyda');
console.log(Meyda);


function makeMeydaDriver() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw 'Browser API navigator.mediaDevices.getUserMedia not available';
  }

  const bufferSize = 1024;
  let context = null;
  let stream = null;
  let meyda = null;

  // async function initialize() {
  //   context = new AudioContext();
  //   stream = await navigator.mediaDevices.getUserMedia({
  //     'audio': true,
  //     'video': false,
  //   });
  //   meyda = Meyda.createMeydaAnalyzer({
  //     audioContext: context,
  //     source: stream,
  //     bufferSize: bufferSize,
  //     windowingFunction: 'blackman',
  //   });
  // }

  return function(sink$) {
    // sink$.take(1).addListener({next: initialize()});
    context = new AudioContext();
    // stream = await navigator.mediaDevices.getUserMedia({
    //   'audio': true,
    //   'video': false,
    // });
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
    });
    // meyda = Meyda.createMeydaAnalyzer({
    //   audioContext: context,
    //   source: stream,
    //   bufferSize: bufferSize,
    //   windowingFunction: 'blackman',
    // });

    return adapt(
      xs.periodic(1000)
        .map(x => {
          if (!meyda) return null;
          context.resume();
          return meyda.get(['rms']);
        })
        // .mapTo(1)
        .filter(f => !!f)
      );  // TODO: update 'rms' part
  }
}

function main(sources) {

  sources.Meyda.addListener({next: f => console.log(f)});

  return {
    DOM: xs.of(div('Hello world!')),
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
  Meyda: makeMeydaDriver(),
});
