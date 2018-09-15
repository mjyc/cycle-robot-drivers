import {Stream} from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import {Driver} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {EventSource} from '@cycle-robot-drivers/action';


class RecognitionSource implements EventSource {
  constructor(
    private _recognition: SpeechRecognition,
  ) {}

  events(eventName: string) {
    return adapt(fromEvent(this._recognition, eventName));
  }
}

export function makeSpeechRecognitionDriver(): Driver<any, any> {
  const recognition: SpeechRecognition = new webkitSpeechRecognition();

  return function(sink$) {
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

    return new RecognitionSource(recognition) as EventSource;
  }
}
