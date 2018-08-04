import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'


export function makeSpeechSynthesisDriver() {
  const synthesis: SpeechSynthesis = window.speechSynthesis;

  return function speechSynthesisDriver(sink$) {
    sink$.addListener({
      next: (utterance) => {
        // if (SpeechSynthesisUtterance)
        console.log(typeof utterance);
        synthesis.speak(utterance);
      }
    });

    return adapt(sink$);
  }
}
