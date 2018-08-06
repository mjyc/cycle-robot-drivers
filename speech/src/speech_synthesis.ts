import {Stream} from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'
import {adapt} from '@cycle/run/lib/adapt'


class UtteranceSource {
  constructor(
    private _utterance: SpeechSynthesisUtterance,
  ) {}

  events(eventName: string): Stream<Event> {
    return adapt(fromEvent(this._utterance, eventName));
  }
}

export function makeSpeechSynthesisDriver() {
  const synthesis: SpeechSynthesis = window.speechSynthesis;
  const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance();

  return function speechSynthesisDriver(sink$) {
    sink$.addListener({
      next: (props) => {
        // array values are SpeechSynthesisUtterance properties that are not
        //   event handlers; see
        //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
        if (!props) {
          synthesis.cancel();
        } else {
          ['lang', 'pitch', 'rate', 'text', 'voice', 'volume'].map(prop => {
            if (prop in props) {
              utterance[prop] = props[prop];
            }
          });
          synthesis.speak(utterance);
        }
      }
    });

    return new UtteranceSource(utterance);
  }
}
