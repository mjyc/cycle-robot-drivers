import xs from 'xstream';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';

// TODO: update this
// import Meyda from 'meyda';
declare var require: any
var Meyda = require('meyda');
console.log(Meyda);


function main(sources) {

  const audioContext = new AudioContext();
  const htmlAudioElement = document.getElementById("audio");
  // Create an "Audio Node" from the Audio Element
  const source = audioContext.createMediaElementSource(htmlAudioElement as any);
  // Connect the Audio Node to your speakers. Now that the audio lives in the
  // Audio Context, you have to explicitly connect it to the speakers in order to
  // hear it
  source.connect(audioContext.destination);

  if (typeof Meyda === "undefined") {
  console.log("Meyda could not be found! Have you included it?");
  }
  else {
    const analyzer = Meyda.createMeydaAnalyzer({
      "audioContext": audioContext,
      "source": source,
      "bufferSize": 512,
      "featureExtractors": ["rms"],
      "callback": features => {
        console.log(features);
      }
    });
    analyzer.start();
  }


  return {
    DOM: xs.of(div('Hello world!')),
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
});
