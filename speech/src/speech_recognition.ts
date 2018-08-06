import {Stream} from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'
import {adapt} from '@cycle/run/lib/adapt'


class RecognitionSource {
  constructor(
    private _recognition: SpeechRecognition,
  ) {}

  events(eventType: string): Stream<Event> {
    return adapt(fromEvent(this._recognition, eventType));
  }
}

export function makeSpeechRecognitionDriver() {
  const recognition: SpeechRecognition = new webkitSpeechRecognition();

  return function speechRecognitionDriver(sink$) {
    sink$.addListener({
      next: (props) => {
        // array values are SpeechSynthesisUtterance properties that are not
        //   event handlers; see
        //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
        if (!props) {
          recognition.abort();
        } else {
          ['lang', 'continuous', 'interimResults', 'maxAlternatives', 'serviceURI'].map((prop) => {
            if (prop in props) {
              recognition[prop] = props[prop]
            };
          });
          recognition.start();
        }
      }
    });

    return new RecognitionSource(recognition);
  }
}
