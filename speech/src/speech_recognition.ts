import {Stream} from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import {adapt} from '@cycle/run/lib/adapt';


class RecognitionSource {
  constructor(
    private _recognition: SpeechRecognition,
  ) {}

  events(eventName: string): Stream<Event> {
    return adapt(fromEvent(this._recognition, eventName));
  }
}

export function makeSpeechRecognitionDriver() {
  const recognition: SpeechRecognition = new webkitSpeechRecognition();

  return function speechRecognitionDriver(sink$) {
    sink$.addListener({
      next: (args) => {
        // array values are SpeechSynthesisUtterance properties that are not
        //   event handlers; see
        //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
        if (!args) {
          recognition.abort();
        } else {
          ['lang', 'continuous', 'interimResults', 'maxAlternatives', 'serviceURI'].map((arg) => {
            if (arg in args) {
              recognition[arg] = args[arg]
            };
          });
          recognition.start();
        }
      }
    });

    return new RecognitionSource(recognition);
  }
}
