import {Stream} from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import {Driver} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {EventSource} from '@cycle-robot-drivers/action';


class UtteranceSource implements EventSource {
  constructor(
    private _utterance: SpeechSynthesisUtterance,
  ) {}

  events(eventName: string) {
    return adapt(fromEvent(this._utterance, eventName));
  }
}

/**
 * A factory for the speech synthesis driver.
 */
export function makeSpeechSynthesisDriver(): Driver<any, any> {
  const synthesis: SpeechSynthesis = window.speechSynthesis;
  const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance();

  return function(sink$) {
    sink$.addListener({
      next: (args) => {
        // array values are SpeechSynthesisUtterance properties that are not
        //   event handlers; see
        //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
        if (!args) {
          synthesis.cancel();
        } else {
          ['lang', 'pitch', 'rate', 'text', 'voice', 'volume'].map(arg => {
            if (arg in args) {
              utterance[arg] = args[arg];
            }
          });
          synthesis.speak(utterance);
        }
      }
    });

    return new UtteranceSource(utterance) as EventSource;
  }
}
